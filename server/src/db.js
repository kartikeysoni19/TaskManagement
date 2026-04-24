import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const client = new MongoClient(uri);
let db;

export async function connectDb() {
  if (db) return db;
  await client.connect();
  db = client.db();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("tasks").createIndex({ userId: 1, createdAt: -1 });
  return db;
}

export const users = () => db.collection("users");
export const tasks = () => db.collection("tasks");
