import { sessions } from "../sessions.js";

function getSessionFromRequest(req) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  return sessions.get(token);
}

export function requireAuth(req, res, next) {
  const session = getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({ message: "Du måste vara inloggad." });
  }

  req.user = session.user;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Du måste vara admin." });
  }

  next();
}
