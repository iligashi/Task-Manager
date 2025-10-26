import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/db/collections"
import { verifyPassword } from "@/lib/auth/password"
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt"
import { loginSchema } from "@/lib/auth/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { email, password } = validation.data

    // Find user
    const users = await getUsersCollection()
    const user = await users.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate tokens
    const userId = user._id!.toString()
    const accessToken = generateAccessToken({ userId, email })
    const refreshToken = generateRefreshToken({ userId, email })

    // Store refresh token
    const now = new Date()
    await users.updateOne(
      { _id: user._id },
      {
        $push: {
          refreshTokens: {
            $each: [
              {
                token: refreshToken,
                createdAt: now,
                ip: request.headers.get("x-forwarded-for") || "unknown",
              },
            ],
            $slice: -5, // Keep only last 5 refresh tokens
          },
        },
      },
    )

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    })

    // Set refresh token as HttpOnly cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
