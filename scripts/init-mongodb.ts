// Load environment variables FIRST before importing any modules
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// Now import modules that depend on environment variables
import { getDb } from "../lib/db/mongodb"
import { UserSchema } from "../lib/db/models/user"
import { TeamSchema } from "../lib/db/models/team"
import { ProjectSchema } from "../lib/db/models/project"
import { TaskSchema } from "../lib/db/models/task"
import { CommentSchema } from "../lib/db/models/comment"
import { ActivityLogSchema } from "../lib/db/models/activity-log"

async function initializeDatabase() {
  try {
    const db = await getDb()

    console.log("Creating collections and indexes...")

    // Users collection
    await db.createCollection("users", UserSchema)
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    console.log("✓ Users collection created")

    // Teams collection
    await db.createCollection("teams", TeamSchema)
    await db.collection("teams").createIndex({ owner: 1 })
    await db.collection("teams").createIndex({ "members.userId": 1 })
    console.log("✓ Teams collection created")

    // Projects collection
    await db.createCollection("projects", ProjectSchema)
    await db.collection("projects").createIndex({ teamId: 1 })
    await db.collection("projects").createIndex({ createdBy: 1 })
    console.log("✓ Projects collection created")

    // Tasks collection
    await db.createCollection("tasks", TaskSchema)
    await db.collection("tasks").createIndex({ projectId: 1 })
    await db.collection("tasks").createIndex({ columnId: 1 })
    await db.collection("tasks").createIndex({ projectId: 1, position: 1 })
    await db.collection("tasks").createIndex({ assignees: 1 })
    // Text index for search
    await db.collection("tasks").createIndex({ title: "text", description: "text" })
    console.log("✓ Tasks collection created")

    // Comments collection
    await db.createCollection("comments", CommentSchema)
    await db.collection("comments").createIndex({ taskId: 1 })
    await db.collection("comments").createIndex({ author: 1 })
    console.log("✓ Comments collection created")

    // Activity logs collection
    await db.createCollection("activity_logs", ActivityLogSchema)
    await db.collection("activity_logs").createIndex({ teamId: 1 })
    await db.collection("activity_logs").createIndex({ createdAt: -1 })
    console.log("✓ Activity logs collection created")

    console.log("\n✅ Database initialization complete!")
    console.log("\nCollections created:")
    console.log("  - users (with email unique index)")
    console.log("  - teams (with owner and members indexes)")
    console.log("  - projects (with teamId and createdBy indexes)")
    console.log("  - tasks (with projectId, columnId, position, assignees, and text search indexes)")
    console.log("  - comments (with taskId and author indexes)")
    console.log("  - activity_logs (with teamId and createdAt indexes)")
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
