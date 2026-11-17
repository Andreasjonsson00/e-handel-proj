import jwt from "jsonwebtoken";

const sessionSecret = process.env.SESSION_TOKEN_SECRET ?? process.env.JWT_SECRET;

function getTokenFromRequest(req) {
  return req.cookies?.session ?? "";
}

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      message: "Du måste vara inloggad.",
    });
  }

  try {
    req.user = jwt.verify(token, sessionSecret);
    res.locals.customer = req.user;
    next();
  } catch {
    return res.status(401).json({
      message: "Du måste vara inloggad.",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Du måste vara admin." });
  }

  next();
}
