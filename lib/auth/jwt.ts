import jwt from "jsonwebtoken"

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-key"
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-key"

const ACCESS_TOKEN_EXPIRY = "15m" // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d" // 7 days

export interface TokenPayload {
  userId: string
  email: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload
}
