import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import {
  getCommentsCollection,
  getTasksCollection,
  getProjectsCollection,
  getTeamsCollection,
  getUsersCollection,
} from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { createCommentSchema } from "@/lib/auth/validation"
import { extractMentions } from "@/lib/utils/mentions"
import { logActivity } from "@/lib/utils/activity-logger"

// GET /api/tasks/:taskId/comments - List comments for a task
export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId } = await params
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

    // Get comments
    const comments = await getCommentsCollection()
    const taskComments = await comments
      .find({ taskId: new ObjectId(taskId) })
      .sort({ createdAt: 1 })
      .toArray()

    return NextResponse.json({
      comments: taskComments.map((comment) => ({
        id: comment._id!.toString(),
        taskId: comment.taskId.toString(),
        author: comment.author.toString(),
        content: comment.content,
        createdAt: comment.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks/:taskId/comments - Add a comment to a task
export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId } = await params
    const body = await request.json()
    const validation = createCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { content } = validation.data

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

    // Create comment
    const comments = await getCommentsCollection()
    const result = await comments.insertOne({
      taskId: new ObjectId(taskId),
      author: new ObjectId(authResult.user.userId),
      content,
      createdAt: new Date(),
    })

    // Increment comments count on task
    await tasks.updateOne({ _id: new ObjectId(taskId) }, { $inc: { commentsCount: 1 } })

    const comment = await comments.findOne({ _id: result.insertedId })

    // Detect mentions and log activity
    const mentions = extractMentions(content)
    if (mentions.length > 0) {
      const users = await getUsersCollection()
      const mentionedUsers = await users
        .find({ name: { $in: mentions.map((m) => m.username) } })
        .toArray()

      // Log mention activity for each mentioned user
      for (const user of mentionedUsers) {
        await logActivity(team._id!.toString(), authResult.user.userId, "comment.added", {
          taskId: taskId,
          taskTitle: task.title,
          mentionTarget: user._id!.toString(),
          mentionTargetName: user.name,
          projectId: project._id!.toString(),
        })
      }
    }

    return NextResponse.json(
      {
        message: "Comment added successfully",
        comment: {
          id: comment!._id!.toString(),
          taskId: comment!.taskId.toString(),
          author: comment!.author.toString(),
          content: comment!.content,
          createdAt: comment!.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
