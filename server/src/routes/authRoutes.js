import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  exchangeCode,
  getAuthorizeUrl,
} from "../integrations/googleAdapter.js";
// PKCE is commented out (every line marked PKCE). The login still works, because our server has the
// client secret. Uncomment all of them – here and in googleAdapter.js – to turn PKCE back on.
import { randomString /* , toCodeChallenge */ } from "../lib/pkce.js"; // PKCE
import { requireAuth } from "../middleware/authMiddleware.js";
import { pool } from "../db.js";

const router = Router();

const SESSION_SECONDS = 8 * 60 * 60; // 8 hours – one token, as in L8's "The simple way"
const sessionSecret = process.env.SESSION_TOKEN_SECRET ?? process.env.JWT_SECRET;

// sameSite 'lax': the cookie IS sent when Google sends the user back to us (a normal navigation).
// 'strict' would block it.
const COOKIE = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};

// state and the code verifier for ONE login: 10 minutes, and only sent to /api/auth/google…
const FLOW_COOKIE = {
  ...COOKIE,
  path: "/api/auth/google",
  maxAge: 10 * 60 * 1000,
};

/* --- 1. START: GET /api/auth/google → the user is sent to Google --- */
router.get("/google", (_req, res) => {
  const state = randomString();
  // const codeVerifier = randomString() // PKCE
  // Saved in httpOnly cookies, so we can check them when the user comes back
  res.cookie("oauth_state", state, FLOW_COOKIE);
  // res.cookie('oauth_verifier', codeVerifier, FLOW_COOKIE) // PKCE
  console.log("\n[OAUTH] 1. Sending the user to Google");
  res.redirect(getAuthorizeUrl(state));
});

/* --- 2. CALLBACK: GET /api/auth/google/callback?code=…&state=… – Google sends the user back here --- */
router.get("/google/callback", async (req, res) => {
  const { code, state, error } = req.query;
  const expectedState = req.cookies.oauth_state;
  // const codeVerifier = req.cookies.oauth_verifier // PKCE

  res.clearCookie("oauth_state", FLOW_COOKIE); // used once – then thrown away
  // res.clearCookie('oauth_verifier', FLOW_COOKIE) // PKCE

  // The user clicked "Cancel" on Google
  if (error) {
    res.redirect("/?error=cancelled");
    return;
  }

  // Not the login WE started → stop (CSRF)
  if (typeof code !== "string" || !expectedState || state !== expectedState) {
    res.redirect("/?error=state");
    return;
  }

  try {
    const user = await exchangeCode(code);
    console.log("[OAUTH] 2. Google says this is:", user.email);
    if (!user.emailVerified) {
      res.redirect("/?error=not-verified");
      return;
    }

    // Google `sub` is the stable identity. E-mail is deliberately not used to
    // find the account, since it can change at the identity provider.
    const customerResult = await pool.query(
      `INSERT INTO users (google_sub, email, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub)
       DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name
       RETURNING id, email, name`,
      [user.sub, user.email, user.name, "user"],
    );
    const customer = customerResult.rows[0];

    // The cookie contains our internal user id, never the external Google id.
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: "customer",
      },
      sessionSecret,
      { expiresIn: SESSION_SECONDS },
    );
    res.cookie("session", token, { ...COOKIE, maxAge: SESSION_SECONDS * 1000 });
    console.log("[OAUTH] 3. Logged in – the shop's own cookie is set");
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/?error=google");
  }
});

/* --- PROTECTED: GET /api/auth/me → { customer } --- */
// In your shop: e.g. GET /api/account/orders → the customer's own orders, where customer_id = res.locals.customer.id
router.get("/me", requireAuth, (_req, res) => {
  res.json({ customer: res.locals.customer });
});

/* --- LOGOUT: POST /api/auth/logout --- */
// React can't remove httpOnly cookies itself – the server has to.
router.post("/logout", (_req, res) => {
  res.clearCookie("session", COOKIE);
  res.json({ loggedOut: true });
});

router.post("/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, username, password, role
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    const passwordOk = user && user.password === password;

    if (!passwordOk) {
      return res
        .status(401)
        .json({ message: "Fel användarnamn eller lösenord." });
    }

    const publicUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(publicUser, sessionSecret, {
      expiresIn: SESSION_SECONDS,
    });

    res.cookie("session", token, {
      ...COOKIE,
      maxAge: SESSION_SECONDS * 1000,
    });

    res.json({ user: publicUser });
  } catch (err) {
    next(err);
  }
});

export default router;
