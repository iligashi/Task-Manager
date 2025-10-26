# Task Management Application

A full-stack collaborative task management application with MongoDB, built following the SPEC-1 requirements.

## Features

### MVP (Implemented)

- **User Authentication**: Email/password authentication with JWT access and refresh tokens
- **Teams/Organizations**: Create and join teams with role-based permissions (Owner, Admin, Member)
- **Projects**: Kanban-style boards with customizable columns
- **Tasks**: Full CRUD operations with assignees, labels, due dates, and priorities
- **Comments**: Add, edit, and delete comments on tasks
- **File Attachments**: Upload and attach files to tasks using Vercel Blob storage
- **Filtering & Sorting**: Filter tasks by status, assignee, due date, and priority
- **Search**: Full-text search across tasks
- **Role-Based Permissions**: Granular access control at team and project levels

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose-style schemas
- **Storage**: Vercel Blob for file attachments
- **Authentication**: JWT with bcrypt password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB instance)
- Vercel account (for Blob storage)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret

# Vercel Blob (automatically configured in Vercel deployment)
BLOB_READ_WRITE_TOKEN=your_blob_token
\`\`\`

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Initialize the database:
\`\`\`bash
npm run db:init
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Collections

- **users**: User accounts with authentication data
- **teams**: Organizations with member roles
- **projects**: Kanban boards with embedded columns
- **tasks**: Task cards with metadata
- **comments**: Task comments
- **activity_logs**: Audit trail (optional)

### Indexes

- Users: `email` (unique)
- Teams: `owner`, `members.userId`
- Projects: `teamId`, `createdBy`
- Tasks: `projectId`, `columnId`, `(projectId, position)`, `assignees`, text index on `title` and `description`
- Comments: `taskId`, `author`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Teams
- `GET /api/teams` - List user's teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `DELETE /api/teams/:id` - Delete team (owner only)
- `POST /api/teams/:id/invite` - Invite member (admin/owner)

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project (admin/owner)
- `DELETE /api/projects/:id` - Delete project (admin/owner)

### Columns
- `POST /api/projects/:projectId/columns` - Create column
- `PUT /api/projects/:projectId/columns/:columnId` - Update column
- `DELETE /api/projects/:projectId/columns/:columnId` - Delete column (admin/owner)

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/search` - Search tasks

### Comments
- `GET /api/tasks/:taskId/comments` - List comments
- `POST /api/tasks/:taskId/comments` - Add comment
- `PUT /api/tasks/:taskId/comments/:commentId` - Update comment (author only)
- `DELETE /api/tasks/:taskId/comments/:commentId` - Delete comment (author/admin)

### Attachments
- `POST /api/uploads` - Upload file
- `POST /api/tasks/:taskId/attachments` - Add attachment to task
- `DELETE /api/tasks/:taskId/attachments` - Remove attachment

## Role-Based Permissions

### Team Roles

- **Owner**: Full control, can delete team
- **Admin**: Manage projects, invite members, manage columns
- **Member**: View and create tasks, add comments

### Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Delete Team | ✓ | ✗ | ✗ |
| Invite Members | ✓ | ✓ | ✗ |
| Create Projects | ✓ | ✓ | ✓ |
| Delete Projects | ✓ | ✓ | ✗ |
| Manage Columns | ✓ | ✓ | ✗ |
| Create Tasks | ✓ | ✓ | ✓ |
| Edit Tasks | ✓ | ✓ | ✓ |
| Delete Tasks | ✓ | ✓ | ✓ |
| Add Comments | ✓ | ✓ | ✓ |
| Delete Own Comments | ✓ | ✓ | ✓ |
| Delete Any Comments | ✓ | ✓ | ✗ |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Start production server:
\`\`\`bash
npm start
\`\`\`

## Future Enhancements (Post-MVP)

- Real-time collaboration with WebSockets
- Activity log and audit trail
- Email notifications for invites and mentions
- Advanced search with filters
- CSV/JSON export and import
- Analytics dashboard
- Dark mode
- Mobile app

## License

MIT

## Contact

For professional architecture consulting, visit [sammuti.com](https://sammuti.com)
