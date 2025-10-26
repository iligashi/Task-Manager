import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getUsersCollection } from "@/lib/db/collections"
import { verifyRefreshToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken)
        const users = await getUsersCollection()

        // Remove refresh token from database
        await users.updateOne(
          { _id: new ObjectId(payload.userId) },
          { $pull: { refreshTokens: { token: refreshToken } } },
        )
      } catch (error) {
        // Token invalid or expired, continue with logout
      }
    }

    const response = NextResponse.json({
      message: "Logged out successfully",
    })

    // Clear refresh token cookie
    response.cookies.delete("refreshToken")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
