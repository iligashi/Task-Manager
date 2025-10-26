import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { createColumnSchema } from "@/lib/auth/validation"

// POST /api/projects/:projectId/columns - Create a new column
export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId } = await params
    const body = await request.json()
    const validation = createColumnSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { title, position } = validation.data

    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check access
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: project.teamId })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create new column
    const newColumn = {
      _id: new ObjectId(),
      title,
      position,
    }

    await projects.updateOne({ _id: new ObjectId(projectId) }, { $push: { columns: newColumn } })

    return NextResponse.json(
      {
        message: "Column created successfully",
        column: {
          id: newColumn._id.toString(),
          title: newColumn.title,
          position: newColumn.position,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create column error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
