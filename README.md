# Task Manager

Full-stack task manager with the same UI and functionality as the Replit project, restructured into two simple folders.

```
task-manager/
├── client/   # React + Vite + Tailwind + shadcn/ui  (port 5173)
└── server/   # Express + MongoDB + JWT + bcrypt     (port 4000)
```

## Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier or a local `mongod`)

## 1. Run the server

```bash
cd server
cp .env.example .env       # then edit .env
npm install
npm run dev                # http://localhost:4000
```

`.env`:
- `PORT` (default 4000)
- `MONGODB_URI` (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/taskmanager`)
- `JWT_SECRET` (any long random string)
- `CLIENT_ORIGIN` (default `http://localhost:5173`)

## 2. Run the client

```bash
cd client
npm install
npm run dev                # http://localhost:5173
```

The client proxies `/api/*` to the server on port 4000, so no extra config needed.

## API

All `/api/tasks/*` endpoints require `Authorization: Bearer <token>`.

- `POST   /api/auth/register` `{ name, email, password }` → `{ token, user }`
- `POST   /api/auth/login`    `{ email, password }`       → `{ token, user }`
- `GET    /api/auth/me`                                   → `{ id, name, email }`
- `GET    /api/tasks`                                     → `Task[]`
- `GET    /api/tasks/summary`                             → `{ total, pending, completed }`
- `POST   /api/tasks`         `{ title, description? }`   → `Task`
- `PUT    /api/tasks/:id`     `{ title?, description?, status? }` → `Task`
- `PATCH  /api/tasks/:id/toggle`                          → `Task`
- `DELETE /api/tasks/:id`                                 → `{ ok: true }`

## Production build

```bash
cd client && npm run build           # outputs client/dist
cd ../server && npm start            # serves the API
```
