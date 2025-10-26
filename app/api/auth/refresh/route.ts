import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getUsersCollection } from "@/lib/db/collections"
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token not found" }, { status: 401 })
    }

    // Verify refresh token
    let payload
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch (error) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    // Check if refresh token exists in database
    const users = await getUsersCollection()
    const user = await users.findOne({
      _id: new ObjectId(payload.userId),
      "refreshTokens.token": refreshToken,
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Generate new tokens
    const userId = user._id!.toString()
    const accessToken = generateAccessToken({ userId, email: user.email })
    const newRefreshToken = generateRefreshToken({ userId, email: user.email })

    // Replace old refresh token with new one
    const now = new Date()
    await users.updateOne(
      { _id: user._id },
      {
        $pull: { refreshTokens: { token: refreshToken } },
      },
    )

    await users.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            $each: [
              {
                token: newRefreshToken,
                createdAt: now,
                ip: request.headers.get("x-forwarded-for") || "unknown",
              },
            ],
            $slice: -5,
          },
        },
      },
    )

    const response = NextResponse.json({
      message: "Token refreshed successfully",
      accessToken,
    })

    // Set new refresh token as HttpOnly cookie
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
