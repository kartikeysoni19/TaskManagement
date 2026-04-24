import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET is not set");

export function signToken(userId) {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const decoded = jwt.verify(header.slice(7).trim(), SECRET);
    if (!decoded?.id) return res.status(401).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
