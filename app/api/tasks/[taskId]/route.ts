import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTasksCollection, getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { updateTaskSchema } from "@/lib/auth/validation"
import { logActivity } from "@/lib/utils/activity-logger"

// GET /api/tasks/:taskId - Get task details
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

    return NextResponse.json({
      task: {
        id: task._id!.toString(),
        projectId: task.projectId.toString(),
        columnId: task.columnId.toString(),
        title: task.title,
        description: task.description,
        assignees: task.assignees.map((a) => a.toString()),
        labels: task.labels,
        subtasks: task.subtasks || [],
        dependencies: task.dependencies?.map((d) => d.toString()) || [],
        blockedBy: task.blockedBy?.map((b) => b.toString()) || [],
        dueDate: task.dueDate,
        priority: task.priority,
        attachments: task.attachments,
        commentsCount: task.commentsCount,
        position: task.position,
        createdBy: task.createdBy.toString(),
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
      },
    })
  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/tasks/:taskId - Update task
export async function PUT(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { taskId } = await params
    const body = await request.json()
    const validation = updateTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
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

    // If moving to a different column, verify it exists
    if (validation.data.columnId) {
      const columnExists = project.columns.some((col) => col._id.toString() === validation.data.columnId)
      if (!columnExists) {
        return NextResponse.json({ error: "Column not found in project" }, { status: 404 })
      }
    }

    // Build update object
    const updateData: any = { updatedAt: new Date() }
    if (validation.data.columnId) updateData.columnId = new ObjectId(validation.data.columnId)
    if (validation.data.title) updateData.title = validation.data.title
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.assignees) updateData.assignees = validation.data.assignees.map((id) => new ObjectId(id))
    if (validation.data.labels) updateData.labels = validation.data.labels
    if (validation.data.subtasks) updateData.subtasks = validation.data.subtasks
    if (validation.data.dependencies) updateData.dependencies = validation.data.dependencies.map((id) => new ObjectId(id))
    if (validation.data.blockedBy) updateData.blockedBy = validation.data.blockedBy.map((id) => new ObjectId(id))
    if (validation.data.dueDate !== undefined)
      updateData.dueDate = validation.data.dueDate ? new Date(validation.data.dueDate) : null
    if (validation.data.priority !== undefined) updateData.priority = validation.data.priority
    if (validation.data.position !== undefined) updateData.position = validation.data.position

    // Get old column info for activity log
    const oldColumnId = task.columnId.toString()
    const isColumnChange = validation.data.columnId && oldColumnId !== validation.data.columnId

    await tasks.updateOne({ _id: new ObjectId(taskId) }, { $set: updateData })

    const updatedTask = await tasks.findOne({ _id: new ObjectId(taskId) })

    // Log activity if column changed
    if (isColumnChange && updatedTask) {
      const fromColumn = project.columns.find((col) => col._id.toString() === oldColumnId)
      const toColumn = project.columns.find((col) => col._id.toString() === validation.data.columnId)

      await logActivity(team._id!.toString(), authResult.user.userId, "task.moved", {
        taskId: taskId,
        taskTitle: task.title,
        fromColumn: fromColumn?.title || "Unknown",
        toColumn: toColumn?.title || "Unknown",
        projectId: project._id!.toString(),
      })
    }

    return NextResponse.json({
      message: "Task updated successfully",
      task: {
        id: updatedTask!._id!.toString(),
        projectId: updatedTask!.projectId.toString(),
        columnId: updatedTask!.columnId.toString(),
        title: updatedTask!.title,
        description: updatedTask!.description,
        assignees: updatedTask!.assignees.map((a) => a.toString()),
        labels: updatedTask!.labels,
        subtasks: updatedTask!.subtasks || [],
        dependencies: updatedTask!.dependencies?.map((d) => d.toString()) || [],
        blockedBy: updatedTask!.blockedBy?.map((b) => b.toString()) || [],
        dueDate: updatedTask!.dueDate,
        priority: updatedTask!.priority,
        attachments: updatedTask!.attachments,
        commentsCount: updatedTask!.commentsCount,
        position: updatedTask!.position,
        createdBy: updatedTask!.createdBy.toString(),
        updatedAt: updatedTask!.updatedAt,
        createdAt: updatedTask!.createdAt,
      },
    })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/:taskId - Delete task
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
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

    // Log activity before deletion
    await logActivity(team._id!.toString(), authResult.user.userId, "task.deleted", {
      taskId: taskId,
      taskTitle: task.title,
      projectId: task.projectId.toString(),
    })

    await tasks.deleteOne({ _id: new ObjectId(taskId) })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
