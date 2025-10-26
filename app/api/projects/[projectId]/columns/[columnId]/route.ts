import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { updateColumnSchema } from "@/lib/auth/validation"

// PUT /api/projects/:projectId/columns/:columnId - Update column
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; columnId: string }> },
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId, columnId } = await params
    const body = await request.json()
    const validation = updateColumnSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

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

    // Update column
    const updateFields: any = {}
    if (validation.data.title) updateFields["columns.$.title"] = validation.data.title
    if (validation.data.position !== undefined) updateFields["columns.$.position"] = validation.data.position

    await projects.updateOne(
      { _id: new ObjectId(projectId), "columns._id": new ObjectId(columnId) },
      { $set: updateFields },
    )

    const updatedProject = await projects.findOne({ _id: new ObjectId(projectId) })
    const updatedColumn = updatedProject?.columns.find((col) => col._id.toString() === columnId)

    return NextResponse.json({
      message: "Column updated successfully",
      column: {
        id: updatedColumn!._id.toString(),
        title: updatedColumn!.title,
        position: updatedColumn!.position,
      },
    })
  } catch (error) {
    console.error("Update column error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/:projectId/columns/:columnId - Delete column
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; columnId: string }> },
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId, columnId } = await params
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

    const userMember = team.members.find((m) => m.userId.toString() === authResult.user.userId)
    if (!userMember || userMember.role === "member") {
      return NextResponse.json({ error: "Only admins and owners can delete columns" }, { status: 403 })
    }

    // Delete column
    await projects.updateOne({ _id: new ObjectId(projectId) }, { $pull: { columns: { _id: new ObjectId(columnId) } } })

    return NextResponse.json({ message: "Column deleted successfully" })
  } catch (error) {
    console.error("Delete column error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
