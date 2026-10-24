import jwt from "jsonwebtoken";

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization ?? "";

  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";
}

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      message: "Du måste vara inloggad.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
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
