import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getUsersCollection } from "@/lib/db/collections"
import { requireAuth } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const users = await getUsersCollection()
    const user = await users.findOne(
      { _id: new ObjectId(authResult.user.userId) },
      { projection: { passwordHash: 0, refreshTokens: 0 } },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id!.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
