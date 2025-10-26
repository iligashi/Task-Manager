import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTasksCollection, getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { createTaskSchema } from "@/lib/auth/validation"
import { logActivity } from "@/lib/utils/activity-logger"

// GET /api/tasks - List tasks with filtering
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const columnId = searchParams.get("columnId")
    const assignee = searchParams.get("assignee")
    const priority = searchParams.get("priority")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check if user has access to the project
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

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

    // Build query
    const query: any = { projectId: new ObjectId(projectId) }
    if (columnId) query.columnId = new ObjectId(columnId)
    if (assignee) query.assignees = new ObjectId(assignee)
    if (priority) query.priority = priority

    const tasks = await getTasksCollection()
    const taskList = await tasks.find(query).sort({ position: 1 }).toArray()

    return NextResponse.json({
      tasks: taskList.map((task) => ({
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
      })),
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const validation = createTaskSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { projectId, columnId, title, description, assignees, labels, dueDate, priority, position } = validation.data

    // Check if user has access to the project
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify column exists in project
    const columnExists = project.columns.some((col) => col._id.toString() === columnId)
    if (!columnExists) {
      return NextResponse.json({ error: "Column not found in project" }, { status: 404 })
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

    // Create task
    const now = new Date()
    const tasks = await getTasksCollection()
    const taskData: any = {
      projectId: new ObjectId(projectId),
      columnId: new ObjectId(columnId),
      title,
      assignees: assignees ? assignees.map((id) => new ObjectId(id)) : [],
      labels: labels || [],
      subtasks: [],
      dependencies: [],
      blockedBy: [],
      attachments: [],
      commentsCount: 0,
      position,
      createdBy: new ObjectId(authResult.user.userId),
      updatedAt: now,
      createdAt: now,
    }

    // Only include optional fields if they have values
    if (description) {
      taskData.description = description
    }
    if (dueDate) {
      taskData.dueDate = new Date(dueDate)
    }
    if (priority) {
      taskData.priority = priority
    }

    const result = await tasks.insertOne(taskData)

    const task = await tasks.findOne({ _id: result.insertedId })

    // Log activity
    await logActivity(team._id!.toString(), authResult.user.userId, "task.created", {
      taskId: task!._id!.toString(),
      taskTitle: task!.title,
      projectId: projectId,
      columnId: columnId,
    })

    return NextResponse.json(
      {
        message: "Task created successfully",
        task: {
          id: task!._id!.toString(),
          projectId: task!.projectId.toString(),
          columnId: task!.columnId.toString(),
          title: task!.title,
          description: task!.description,
          assignees: task!.assignees.map((a) => a.toString()),
          labels: task!.labels,
          subtasks: task!.subtasks || [],
          dependencies: task!.dependencies?.map((d) => d.toString()) || [],
          blockedBy: task!.blockedBy?.map((b) => b.toString()) || [],
          dueDate: task!.dueDate,
          priority: task!.priority,
          attachments: task!.attachments,
          commentsCount: task!.commentsCount,
          position: task!.position,
          createdBy: task!.createdBy.toString(),
          updatedAt: task!.updatedAt,
          createdAt: task!.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
