import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTasksCollection, getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"

// GET /api/tasks/search - Search tasks by text
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const projectId = searchParams.get("projectId")

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Get user's accessible projects
    const teams = await getTeamsCollection()
    const userTeams = await teams
      .find({
        $or: [
          { owner: new ObjectId(authResult.user.userId) },
          { "members.userId": new ObjectId(authResult.user.userId) },
        ],
      })
      .toArray()

    const teamIds = userTeams.map((t) => t._id!)

    const projects = await getProjectsCollection()
    const userProjects = await projects.find({ teamId: { $in: teamIds } }).toArray()
    const projectIds = userProjects.map((p) => p._id!)

    // Build search query
    const searchQuery: any = {
      projectId: { $in: projectIds },
      $text: { $search: query },
    }

    if (projectId) {
      searchQuery.projectId = new ObjectId(projectId)
    }

    const tasks = await getTasksCollection()
    const searchResults = await tasks.find(searchQuery).limit(50).toArray()

    return NextResponse.json({
      tasks: searchResults.map((task) => ({
        id: task._id!.toString(),
        projectId: task.projectId.toString(),
        columnId: task.columnId.toString(),
        title: task.title,
        description: task.description,
        assignees: task.assignees.map((a) => a.toString()),
        labels: task.labels,
        dueDate: task.dueDate,
        priority: task.priority,
        position: task.position,
        createdBy: task.createdBy.toString(),
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
      })),
    })
  } catch (error) {
    console.error("Search tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
