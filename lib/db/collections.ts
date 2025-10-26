import { getDb } from "./mongodb"
import type { User } from "./models/user"
import type { Team } from "./models/team"
import type { Project } from "./models/project"
import type { Task } from "./models/task"
import type { Comment } from "./models/comment"
import type { ActivityLog } from "./models/activity-log"

export async function getUsersCollection() {
  const db = await getDb()
  return db.collection<User>("users")
}

export async function getTeamsCollection() {
  const db = await getDb()
  return db.collection<Team>("teams")
}

export async function getProjectsCollection() {
  const db = await getDb()
  return db.collection<Project>("projects")
}

export async function getTasksCollection() {
  const db = await getDb()
  return db.collection<Task>("tasks")
}

export async function getCommentsCollection() {
  const db = await getDb()
  return db.collection<Comment>("comments")
}

export async function getActivityLogsCollection() {
  const db = await getDb()
  return db.collection<ActivityLog>("activity_logs")
}
