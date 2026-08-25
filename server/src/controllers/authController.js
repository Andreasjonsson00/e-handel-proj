import crypto from "node:crypto";
import { pool } from "../db.js";
import { sessions } from "../sessions.js";

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, username, password, role
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ message: "Fel användarnamn eller lösenord." });
    }

    const token = crypto.randomUUID();
    const publicUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    sessions.set(token, { user: publicUser });

    res.json({
      token,
      user: publicUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfel vid inloggning." });
  }
}

export function getMe(req, res) {
  res.json({ user: req.user });
}

export function logout(req, res) {
  const token = req.headers.authorization.slice("Bearer ".length);
  sessions.delete(token);
  res.status(204).send();
}
