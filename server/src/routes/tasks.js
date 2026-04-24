import { Router } from "express";
import { ObjectId } from "mongodb";
import { tasks } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const userOid = (req) => new ObjectId(req.userId);
const taskOid = (id) => { try { return new ObjectId(String(id)); } catch { return null; } };

const serialize = (t) => ({
  id: t._id.toHexString(),
  title: t.title,
  description: t.description,
  status: t.status,
  createdAt: t.createdAt.toISOString(),
  updatedAt: t.updatedAt.toISOString(),
});

router.get("/", async (req, res) => {
  const rows = await tasks().find({ userId: userOid(req) }).sort({ createdAt: -1 }).toArray();
  res.json(rows.map(serialize));
});

router.get("/summary", async (req, res) => {
  const agg = await tasks().aggregate([
    { $match: { userId: userOid(req) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).toArray();
  let pending = 0, completed = 0;
  for (const r of agg) {
    if (r._id === "pending") pending = r.count;
    if (r._id === "completed") completed = r.count;
  }
  res.json({ total: pending + completed, pending, completed });
});

router.post("/", async (req, res) => {
  const { title, description } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ message: "Title is required" });
  const now = new Date();
  const doc = {
    _id: new ObjectId(),
    userId: userOid(req),
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await tasks().insertOne(doc);
  res.json(serialize(doc));
});

router.put("/:id", async (req, res) => {
  const oid = taskOid(req.params.id);
  if (!oid) return res.status(404).json({ message: "Task not found" });
  const { title, description, status } = req.body || {};
  const set = { updatedAt: new Date() };
  if (title !== undefined) set.title = String(title).trim();
  if (description !== undefined) set.description = String(description).trim();
  if (status === "pending" || status === "completed") set.status = status;
  const row = await tasks().findOneAndUpdate(
    { _id: oid, userId: userOid(req) },
    { $set: set },
    { returnDocument: "after" },
  );
  if (!row) return res.status(404).json({ message: "Task not found" });
  res.json(serialize(row));
});

router.delete("/:id", async (req, res) => {
  const oid = taskOid(req.params.id);
  if (!oid) return res.status(404).json({ message: "Task not found" });
  const r = await tasks().deleteOne({ _id: oid, userId: userOid(req) });
  if (r.deletedCount === 0) return res.status(404).json({ message: "Task not found" });
  res.json({ ok: true });
});

router.patch("/:id/toggle", async (req, res) => {
  const oid = taskOid(req.params.id);
  if (!oid) return res.status(404).json({ message: "Task not found" });
  const existing = await tasks().findOne({ _id: oid, userId: userOid(req) });
  if (!existing) return res.status(404).json({ message: "Task not found" });
  const newStatus = existing.status === "pending" ? "completed" : "pending";
  const row = await tasks().findOneAndUpdate(
    { _id: oid, userId: userOid(req) },
    { $set: { status: newStatus, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  res.json(serialize(row));
});

export default router;
