import { type NextRequest, NextResponse } from "next/server"
import { getUsersCollection } from "@/lib/db/collections"
import { hashPassword } from "@/lib/auth/password"
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt"
import { registerSchema } from "@/lib/auth/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.errors }, { status: 400 })
    }

    const { name, email, password } = validation.data

    // Check if user already exists
    const users = await getUsersCollection()
    const existingUser = await users.findOne({ email })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const now = new Date()
    const refreshToken = generateRefreshToken({ userId: "", email })

    const result = await users.insertOne({
      name,
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      refreshTokens: [
        {
          token: refreshToken,
          createdAt: now,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        },
      ],
    })

    const userId = result.insertedId.toString()
    const accessToken = generateAccessToken({ userId, email })
    const newRefreshToken = generateRefreshToken({ userId, email })

    // Update refresh token with actual userId
    await users.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          refreshTokens: [
            {
              token: newRefreshToken,
              createdAt: now,
              ip: request.headers.get("x-forwarded-for") || "unknown",
            },
          ],
        },
      },
    )

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: userId,
          name,
          email,
        },
        accessToken,
      },
      { status: 201 },
    )

    // Set refresh token as HttpOnly cookie
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
