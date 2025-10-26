import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { verifyAccessToken } from "./jwt"
import { canManageTeam, canDeleteTeam, canManageProject, canAccessProject, canManageColumns } from "./permissions"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyAccessToken(token)
    return { user: payload }
  } catch (error) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
  }
}

export async function requireTeamAccess(userId: string, teamId: string) {
  const role = await canManageTeam(userId, new ObjectId(teamId))
  if (!role) {
    return NextResponse.json({ error: "Access denied: insufficient team permissions" }, { status: 403 })
  }
  return null
}

export async function requireTeamOwner(userId: string, teamId: string) {
  const canDelete = await canDeleteTeam(userId, new ObjectId(teamId))
  if (!canDelete) {
    return NextResponse.json({ error: "Access denied: only team owner can perform this action" }, { status: 403 })
  }
  return null
}

export async function requireProjectAccess(userId: string, projectId: string) {
  const hasAccess = await canAccessProject(userId, new ObjectId(projectId))
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied: you are not a member of this project's team" }, { status: 403 })
  }
  return null
}

export async function requireProjectManage(userId: string, projectId: string) {
  const canManage = await canManageProject(userId, new ObjectId(projectId))
  if (!canManage) {
    return NextResponse.json(
      { error: "Access denied: only team owners and admins can manage projects" },
      { status: 403 },
    )
  }
  return null
}

export async function requireColumnManage(userId: string, projectId: string) {
  const canManage = await canManageColumns(userId, new ObjectId(projectId))
  if (!canManage) {
    return NextResponse.json(
      { error: "Access denied: only team owners and admins can manage columns" },
      { status: 403 },
    )
  }
  return null
}
