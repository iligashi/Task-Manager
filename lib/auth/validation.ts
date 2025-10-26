import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  description: z.string().optional(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"], { errorMap: () => ({ message: "Role must be admin or member" }) }),
})

export const createProjectSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  privacy: z.enum(["team", "private"]).default("team"),
})

export const updateProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").optional(),
  description: z.string().optional(),
  privacy: z.enum(["team", "private"]).optional(),
})

export const createColumnSchema = z.object({
  title: z.string().min(1, "Column title is required"),
  position: z.number().int().min(0),
})

export const updateColumnSchema = z.object({
  title: z.string().min(1, "Column title is required").optional(),
  position: z.number().int().min(0).optional(),
})

export const createTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  columnId: z.string().min(1, "Column ID is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  labels: z
    .array(
      z.object({
        name: z.string(),
        color: z.string(),
      }),
    )
    .optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  position: z.number().int().min(0),
})

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  position: z.number(),
})

export const updateTaskSchema = z.object({
  columnId: z.string().optional(),
  title: z.string().min(1, "Task title is required").optional(),
  description: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  labels: z
    .array(
      z.object({
        name: z.string(),
        color: z.string(),
      }),
    )
    .optional(),
  subtasks: z.array(subtaskSchema).optional(),
  dependencies: z.array(z.string()).optional(),
  blockedBy: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  position: z.number().int().min(0).optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
})
