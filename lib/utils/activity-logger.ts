import { ObjectId } from "mongodb"
import { getActivityLogsCollection } from "@/lib/db/collections"

export type ActivityAction =
  | "task.created"
  | "task.updated"
  | "task.moved"
  | "task.deleted"
  | "task.assigned"
  | "task.completed"
  | "column.created"
  | "column.deleted"
  | "project.created"
  | "project.updated"
  | "comment.added"

export interface ActivityMeta {
  taskId?: string
  taskTitle?: string
  fromColumn?: string
  toColumn?: string
  columnId?: string
  projectId?: string
  userId?: string
  userName?: string
  [key: string]: any
}

export async function logActivity(
  teamId: string,
  actor: string,
  action: ActivityAction,
  meta: ActivityMeta,
) {
  try {
    const activityLogs = await getActivityLogsCollection()
    await activityLogs.insertOne({
      teamId: new ObjectId(teamId),
      actor: new ObjectId(actor),
      action,
      meta,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
    // Don't throw - activity logging should not break the main flow
  }
}

