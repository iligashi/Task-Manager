import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTeamsCollection, getUsersCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"

// GET /api/teams/:teamId - Get team details
export async function GET(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { teamId } = await params
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: new ObjectId(teamId) })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get member details including owner
    const users = await getUsersCollection()
    const owner = await users.findOne({ _id: team.owner }, { projection: { name: 1, email: 1, avatarUrl: 1 } })
    
    const memberIds = team.members.map((m) => m.userId)
    const memberUsers = await users
      .find({ _id: { $in: memberIds } }, { projection: { name: 1, email: 1, avatarUrl: 1 } })
      .toArray()

    const membersWithDetails = team.members.map((m) => {
      const user = memberUsers.find((u) => u._id!.toString() === m.userId.toString())
      return {
        userId: m.userId.toString(),
        role: m.role,
        name: user?.name || "User",
        email: user?.email,
        avatarUrl: user?.avatarUrl,
      }
    })

    return NextResponse.json({
      team: {
        id: team._id!.toString(),
        name: team.name,
        description: team.description,
        owner: {
          id: team.owner.toString(),
          name: owner?.name || "User",
          email: owner?.email,
          avatarUrl: owner?.avatarUrl,
        },
        members: membersWithDetails,
        createdAt: team.createdAt,
      },
    })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/teams/:teamId - Delete team (owner only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { teamId } = await params
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: new ObjectId(teamId) })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is owner
    if (team.owner.toString() !== authResult.user.userId) {
      return NextResponse.json({ error: "Only team owner can delete the team" }, { status: 403 })
    }

    await teams.deleteOne({ _id: new ObjectId(teamId) })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
