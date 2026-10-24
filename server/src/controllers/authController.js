import { pool } from "../db.js";
import jwt from "jsonwebtoken";

export async function login(req, res, next) {
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

    const publicUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(publicUser, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: publicUser,
    });
  } catch (err) {
    next(err);
  }
}

export function getMe(req, res) {
  res.json({ user: req.user });
}

export function logout(req, res) {
  res.status(204).send();
}