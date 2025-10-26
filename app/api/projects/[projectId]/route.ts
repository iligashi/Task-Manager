import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getProjectsCollection, getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { updateProjectSchema } from "@/lib/auth/validation"

// GET /api/projects/:projectId - Get project details
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId } = await params
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user has access to this project
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
      project: {
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
      },
    })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/projects/:projectId - Update project
export async function PUT(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId } = await params
    const body = await request.json()
    const validation = updateProjectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user has access
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: project.teamId })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const userMember = team.members.find((m) => m.userId.toString() === authResult.user.userId)
    if (!userMember || userMember.role === "member") {
      return NextResponse.json({ error: "Only admins and owners can update projects" }, { status: 403 })
    }

    // Update project
    const updateData: any = {}
    if (validation.data.name) updateData.name = validation.data.name
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.privacy) updateData["settings.privacy"] = validation.data.privacy

    await projects.updateOne({ _id: new ObjectId(projectId) }, { $set: updateData })

    const updatedProject = await projects.findOne({ _id: new ObjectId(projectId) })

    return NextResponse.json({
      message: "Project updated successfully",
      project: {
        id: updatedProject!._id!.toString(),
        teamId: updatedProject!.teamId.toString(),
        name: updatedProject!.name,
        description: updatedProject!.description,
        columns: updatedProject!.columns.map((col) => ({
          id: col._id.toString(),
          title: col.title,
          position: col.position,
        })),
        settings: updatedProject!.settings,
        createdBy: updatedProject!.createdBy.toString(),
        createdAt: updatedProject!.createdAt,
      },
    })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/:projectId - Delete project
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { projectId } = await params
    const projects = await getProjectsCollection()
    const project = await projects.findOne({ _id: new ObjectId(projectId) })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user is owner or admin
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: project.teamId })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const userMember = team.members.find((m) => m.userId.toString() === authResult.user.userId)
    if (!userMember || userMember.role === "member") {
      return NextResponse.json({ error: "Only admins and owners can delete projects" }, { status: 403 })
    }

    await projects.deleteOne({ _id: new ObjectId(projectId) })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
