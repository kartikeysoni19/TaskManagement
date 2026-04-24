import { Router } from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { users } from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: "Name, email, and password (>=6 chars) required" });
  }
  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await users().findOne({ email: normalizedEmail }, { projection: { _id: 1 } });
  if (existing) return res.status(400).json({ message: "An account with that email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const _id = new ObjectId();
  await users().insertOne({
    _id,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });
  const user = { id: _id.toHexString(), name: String(name).trim(), email: normalizedEmail };
  res.json({ token: signToken(user.id), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const row = await users().findOne({ email: String(email).toLowerCase().trim() });
  if (!row) return res.status(401).json({ message: "Invalid email or password" });
  const ok = await bcrypt.compare(String(password), row.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid email or password" });
  const id = row._id.toHexString();
  res.json({ token: signToken(id), user: { id, name: row.name, email: row.email } });
});

router.get("/me", requireAuth, async (req, res) => {
  let oid;
  try { oid = new ObjectId(req.userId); } catch { return res.status(401).json({ message: "Invalid user" }); }
  const row = await users().findOne({ _id: oid }, { projection: { name: 1, email: 1 } });
  if (!row) return res.status(401).json({ message: "User no longer exists" });
  res.json({ id: row._id.toHexString(), name: row.name, email: row.email });
});

export default router;
