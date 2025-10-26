import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import {
  getCommentsCollection,
  getTasksCollection,
  getProjectsCollection,
  getTeamsCollection,
} from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { updateCommentSchema } from "@/lib/auth/validation"

// PUT /api/tasks/:taskId/comments/:commentId - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; commentId: string }> },
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId, commentId } = await params
    const body = await request.json()
    const validation = updateCommentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { content } = validation.data

    const comments = await getCommentsCollection()
    const comment = await comments.findOne({ _id: new ObjectId(commentId) })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user is the author
    if (comment.author.toString() !== authResult.user.userId) {
      return NextResponse.json({ error: "Only the comment author can edit it" }, { status: 403 })
    }

    // Update comment
    await comments.updateOne({ _id: new ObjectId(commentId) }, { $set: { content } })

    const updatedComment = await comments.findOne({ _id: new ObjectId(commentId) })

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: {
        id: updatedComment!._id!.toString(),
        taskId: updatedComment!.taskId.toString(),
        author: updatedComment!.author.toString(),
        content: updatedComment!.content,
        createdAt: updatedComment!.createdAt,
      },
    })
  } catch (error) {
    console.error("Update comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/:taskId/comments/:commentId - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; commentId: string }> },
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId, commentId } = await params

    const comments = await getCommentsCollection()
    const comment = await comments.findOne({ _id: new ObjectId(commentId) })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user is the author or has admin rights
    const tasks = await getTasksCollection()
    const task = await tasks.findOne({ _id: comment.taskId })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

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

    const userMember = team.members.find((m) => m.userId.toString() === authResult.user.userId)
    const isAuthor = comment.author.toString() === authResult.user.userId
    const isAdmin = userMember && (userMember.role === "owner" || userMember.role === "admin")

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Only the author or admins can delete comments" }, { status: 403 })
    }

    // Delete comment
    await comments.deleteOne({ _id: new ObjectId(commentId) })

    // Decrement comments count on task
    await tasks.updateOne({ _id: new ObjectId(taskId) }, { $inc: { commentsCount: -1 } })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
