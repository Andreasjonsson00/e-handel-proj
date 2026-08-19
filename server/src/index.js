import express from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import cors from "cors";
import crypto from "node:crypto";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const demoUsers = [
  {
    id: 1,
    username: "user",
    password: "user123",
    role: "user",
  },
  {
    id: 2,
    username: "admin",
    password: "admin123",
    role: "admin",
  },
];

const sessions = new Map();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

function getSessionFromRequest(req) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  return sessions.get(token);
}

function requireAuth(req, res, next) {
  const session = getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({ message: "Du måste vara inloggad." });
  }

  req.user = session.user;
  next();
}

app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = demoUsers.find(
    (demoUser) =>
      demoUser.username === username && demoUser.password === password,
  );

  if (!user) {
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
});

app.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization.slice("Bearer ".length);
  sessions.delete(token);
  res.status(204).send();
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM products`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
