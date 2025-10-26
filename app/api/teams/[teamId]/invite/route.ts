import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTeamsCollection, getUsersCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { inviteMemberSchema } from "@/lib/auth/validation"

// POST /api/teams/:teamId/invite - Invite member to team
export async function POST(request: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { teamId } = await params
    const body = await request.json()
    const validation = inviteMemberSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { email, role } = validation.data

    // Get team
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: new ObjectId(teamId) })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user is admin or owner
    const userMember = team.members.find((m) => m.userId.toString() === authResult.user.userId)
    if (!userMember || (userMember.role !== "owner" && userMember.role !== "admin")) {
      return NextResponse.json({ error: "Only team owners and admins can invite members" }, { status: 403 })
    }

    // Find user by email
    const users = await getUsersCollection()
    const invitedUser = await users.findOne({ email })

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = team.members.some((m) => m.userId.toString() === invitedUser._id!.toString())
    if (isAlreadyMember) {
      return NextResponse.json({ error: "User is already a team member" }, { status: 409 })
    }

    // Add member to team
    await teams.updateOne(
      { _id: new ObjectId(teamId) },
      {
        $push: {
          members: {
            userId: invitedUser._id,
            role,
          },
        },
      },
    )

    return NextResponse.json({
      message: "Member invited successfully",
      member: {
        userId: invitedUser._id!.toString(),
        name: invitedUser.name,
        email: invitedUser.email,
        role,
      },
    })
  } catch (error) {
    console.error("Invite member error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
