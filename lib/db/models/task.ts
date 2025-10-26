import type { ObjectId } from "mongodb"

export interface TaskLabel {
  name: string
  color: string
}

export interface TaskAttachment {
  url: string
  key: string
  filename: string
  size: number
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
}

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Task {
  _id?: ObjectId
  projectId: ObjectId
  columnId: ObjectId
  title: string
  description?: string
  assignees: ObjectId[]
  labels: TaskLabel[]
  subtasks: Subtask[]
  dependencies: ObjectId[] // IDs of tasks this task depends on
  blockedBy: ObjectId[] // IDs of tasks that block this task
  dueDate?: Date
  priority?: TaskPriority
  attachments: TaskAttachment[]
  commentsCount: number
  position: number
  createdBy: ObjectId
  updatedAt: Date
  createdAt: Date
}

export const TaskSchema = {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["projectId", "columnId", "title", "position", "createdBy", "createdAt", "updatedAt"],
      properties: {
        projectId: {
          bsonType: "objectId",
          description: "Project ID is required",
        },
        columnId: {
          bsonType: "objectId",
          description: "Column ID is required",
        },
        title: {
          bsonType: "string",
          description: "Task title is required",
        },
        description: {
          bsonType: "string",
        },
        assignees: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        labels: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "color"],
            properties: {
              name: { bsonType: "string" },
              color: { bsonType: "string" },
            },
          },
        },
        subtasks: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "title", "completed", "position"],
            properties: {
              id: { bsonType: "string" },
              title: { bsonType: "string" },
              completed: { bsonType: "bool" },
              position: { bsonType: "number" },
            },
          },
        },
        dependencies: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        blockedBy: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        dueDate: {
          bsonType: "date",
        },
        priority: {
          bsonType: "string",
          enum: ["low", "medium", "high", "urgent"],
        },
        attachments: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["url", "key", "filename", "size"],
            properties: {
              url: { bsonType: "string" },
              key: { bsonType: "string" },
              filename: { bsonType: "string" },
              size: { bsonType: "number" },
            },
          },
        },
        commentsCount: {
          bsonType: "number",
        },
        position: {
          bsonType: "number",
        },
        createdBy: {
          bsonType: "objectId",
        },
        updatedAt: {
          bsonType: "date",
        },
        createdAt: {
          bsonType: "date",
        },
      },
    },
  },
}
