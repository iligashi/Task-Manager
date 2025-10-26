import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { createProjectSchema } from "@/lib/auth/validation"

// GET /api/projects - List all projects for user's teams
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    // Get user's teams
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

    // Build query
    const query: any = { teamId: { $in: teamIds } }
    if (teamId) {
      query.teamId = new ObjectId(teamId)
    }

    const projects = await getProjectsCollection()
    const userProjects = await projects.find(query).toArray()

    return NextResponse.json({
      projects: userProjects.map((project) => ({
        id: project._id!.toString(),
        teamId: project.teamId.toString(),
        name: project.name,
        description: project.description,
        columns: project.columns.map((col) => ({
          id: col._id.toString(),
          title: col.title,
          position: col.position,
        })),
        settings: project.settings,
        createdBy: project.createdBy.toString(),
        createdAt: project.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const validation = createProjectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { teamId, name, description, privacy } = validation.data

    // Check if user is a member of the team
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: new ObjectId(teamId) })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "You must be a team member to create projects" }, { status: 403 })
    }

    // Create project with default columns
    const projects = await getProjectsCollection()
    const projectData: any = {
      teamId: new ObjectId(teamId),
      name,
      columns: [
        { _id: new ObjectId(), title: "To Do", position: 0 },
        { _id: new ObjectId(), title: "In Progress", position: 1 },
        { _id: new ObjectId(), title: "Done", position: 2 },
      ],
      settings: { privacy: privacy || "team" },
      createdBy: new ObjectId(authResult.user.userId),
      createdAt: new Date(),
    }

    // Only include description if it has a value
    if (description) {
      projectData.description = description
    }

    const result = await projects.insertOne(projectData)

    const project = await projects.findOne({ _id: result.insertedId })

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: {
          id: project!._id!.toString(),
          teamId: project!.teamId.toString(),
          name: project!.name,
          description: project!.description,
          columns: project!.columns.map((col) => ({
            id: col._id.toString(),
            title: col.title,
            position: col.position,
          })),
          settings: project!.settings,
          createdBy: project!.createdBy.toString(),
          createdAt: project!.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
