import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getActivityLogsCollection, getTeamsCollection, getUsersCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"

// GET /api/teams/:teamId/activity - Get activity log for a team
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { teamId } = await params

    // Check if user has access to the team
    const teams = await getTeamsCollection()
    const team = await teams.findOne({ _id: new ObjectId(teamId) })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members.some((m) => m.userId.toString() === authResult.user.userId)
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get activity logs
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = parseInt(searchParams.get("skip") || "0")

    const activityLogs = await getActivityLogsCollection()
    const logs = await activityLogs
      .find({ teamId: new ObjectId(teamId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray()

    // Get user info for actors
    const users = await getUsersCollection()
    const userIds = [...new Set(logs.map((log) => log.actor.toString()))]
    const userMap = new Map()

    if (userIds.length > 0) {
      const userList = await users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray()
      userList.forEach((user) => {
        userMap.set(user._id!.toString(), user.name)
      })
    }

    return NextResponse.json({
      activities: logs.map((log) => ({
        id: log._id!.toString(),
        action: log.action,
        actor: {
          id: log.actor.toString(),
          name: userMap.get(log.actor.toString()) || "Unknown",
        },
        meta: log.meta,
        createdAt: log.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get activity log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

