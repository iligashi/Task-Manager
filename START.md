# Task Manager - Startup Guide

## 🚀 Quick Start

The Task Manager is a full-stack Next.js application that combines frontend and backend in one server.

### Prerequisites
- MongoDB running on `localhost:27017`
- Node.js 18+ and pnpm installed

### Start the Application

**Option 1: Using pnpm (Recommended)**
```bash
cd C:\Users\IlazG\Desktop\projects\task-manager
pnpm run dev
```

**Option 2: Using npm**
```bash
cd C:\Users\IlazG\Desktop\projects\task-manager
npm run dev
```

The server will start at: **http://localhost:3000**

---

## 📊 How It Works

### Architecture
- **Frontend + Backend**: Next.js App Router combines both
- **API Routes**: Located in `app/api/` - handle all backend logic
- **Pages**: Located in `app/` - handle frontend rendering
- **Database**: MongoDB at `localhost:27017/task-manager`

### Application Flow

1. **User visits** → Next.js serves the page
2. **User interacts** → Frontend calls API routes (same server)
3. **API routes** → Connect to MongoDB and process requests
4. **Response** → Sent back to frontend
5. **Frontend updates** → User sees changes

### When You Run `pnpm run dev`:

```
┌─────────────────────────────────────────┐
│     Next.js Development Server          │
│     http://localhost:3000                │
├─────────────────────────────────────────┤
│                                         │
│  FRONTEND (React + Next.js)             │
│  ├── app/dashboard/page.tsx             │
│  ├── app/projects/[projectId]/page.tsx  │
│  ├── app/login/page.tsx                 │
│  └── Components in components/          │
│                                         │
│  BACKEND (API Routes)                   │
│  ├── app/api/auth/*                     │
│  ├── app/api/teams/*                    │
│  ├── app/api/projects/*                 │
│  ├── app/api/tasks/*                    │
│  └── Connects to MongoDB                │
│                                         │
└─────────────────────────────────────────┘
                    ↓
          ┌─────────────────┐
          │     MongoDB     │
          │ localhost:27017 │
          │  task-manager   │
          └─────────────────┘
```

---

## 🗄️ Database Collections

Collections created:
- ✅ `users` - User accounts
- ✅ `teams` - Teams/organizations
- ✅ `projects` - Kanban boards
- ✅ `tasks` - Task cards
- ✅ `comments` - Task comments
- ✅ `activity_logs` - Audit trail

---

## 🔧 Environment Variables

Located in `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
BLOB_READ_WRITE_TOKEN=placeholder
```

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server (frontend + backend) |
| `pnpm run build` | Build for production |
| `pnpm run start` | Start production server |
| `pnpm run db:init` | Initialize MongoDB collections |
| `pnpm run lint` | Run ESLint |

---

## 🌐 Access the Application

1. Open your browser: **http://localhost:3000**
2. Register a new account or login
3. Create teams and projects
4. Start managing tasks!

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: Check with `mongosh --eval "db.adminCommand('ping')"`
- Verify `.env.local` has correct `MONGODB_URI`

### Port 3000 Already in Use
- Stop other processes: `netstat -ano | findstr :3000`
- Kill process: `taskkill /PID <process_id> /F`

### Database Not Initialized
```bash
pnpm run db:init
```

---

## ✨ Features

- 🔐 Authentication with JWT
- 👥 Team collaboration
- 📋 Kanban board projects
- ✅ Task management (assignees, priorities, due dates)
- 💬 Comments on tasks
- 📎 File attachments
- 🔍 Full-text search
- 🎨 Beautiful UI with shadcn/ui

---

**Your application is running and ready to use!** 🎉

