import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./db.js";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ORIGIN, credentials: false }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

connectDb()
  .then(() => app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
