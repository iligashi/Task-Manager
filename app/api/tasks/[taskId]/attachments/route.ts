import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTasksCollection, getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"

// POST /api/tasks/:taskId/attachments - Add attachment to task
export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId } = await params
    const body = await request.json()

    const { url, key, filename, size } = body

    if (!url || !key || !filename || !size) {
      return NextResponse.json({ error: "Missing required attachment fields" }, { status: 400 })
    }

    const tasks = await getTasksCollection()
    const task = await tasks.findOne({ _id: new ObjectId(taskId) })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user has access
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: task.projectId })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: project.teamId })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Add attachment to task
    const attachment = { url, key, filename, size }
    await tasks.updateOne({ _id: new ObjectId(taskId) }, { $push: { attachments: attachment } })

    return NextResponse.json({
      message: "Attachment added successfully",
      attachment,
    })
  } catch (error) {
    console.error("Add attachment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/:taskId/attachments - Remove attachment from task
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId } = await params
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Attachment key is required" }, { status: 400 })
    }

    const tasks = await getTasksCollection()
    const task = await tasks.findOne({ _id: new ObjectId(taskId) })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user has access
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: task.projectId })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: project.teamId })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Remove attachment from task
    await tasks.updateOne({ _id: new ObjectId(taskId) }, { $pull: { attachments: { key } } })

    return NextResponse.json({ message: "Attachment removed successfully" })
  } catch (error) {
    console.error("Remove attachment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
