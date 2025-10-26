import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getTeamsCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"
import { createTeamSchema } from "@/lib/auth/validation"

// GET /api/teams - List all teams for the authenticated user
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const teams = await getTeamsCollection()
    const userTeams = await teams
      .find({
        $or: [
          { owner: new ObjectId(authResult.user.userId) },
          { "members.userId": new ObjectId(authResult.user.userId) },
        ],
      })
      .toArray()

    return NextResponse.json({
      teams: userTeams.map((team) => ({
        id: team._id!.toString(),
        name: team.name,
        description: team.description,
        owner: team.owner.toString(),
        members: team.members.map((m) => ({
          userId: m.userId.toString(),
          role: m.role,
        })),
        createdAt: team.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const validation = createTeamSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { name, description } = validation.data
    const userId = new ObjectId(authResult.user.userId)

    const teams = await getTeamsCollection()
    const result = await teams.insertOne({
      name,
      description,
      owner: userId,
      members: [{ userId, role: "owner" }],
      createdAt: new Date(),
    })

    const team = await teams.findOne({ _id: result.insertedId })

    return NextResponse.json(
      {
        message: "Team created successfully",
        team: {
          id: team!._id!.toString(),
          name: team!.name,
          description: team!.description,
          owner: team!.owner.toString(),
          members: team!.members.map((m) => ({
            userId: m.userId.toString(),
            role: m.role,
          })),
          createdAt: team!.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
