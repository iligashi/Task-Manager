import type { ObjectId } from "mongodb"
import { getTeamsCollection, getProjectsCollection } from "@/lib/db/collections"
import type { TeamRole } from "@/lib/db/models/team"

export interface PermissionContext {
  userId: string
  teamId?: ObjectId
  projectId?: ObjectId
}

export async function getUserTeamRole(userId: string, teamId: ObjectId): Promise<TeamRole | null> {
  const teams = await getTeamsCollection()
  const team = await teams.findOne({ _id: teamId })

  if (!team) return null

  const member = team.members.find((m) => m.userId.toString() === userId)
  return member ? member.role : null
}

export async function canManageTeam(userId: string, teamId: ObjectId): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId)
  return role === "owner" || role === "admin"
}

export async function canDeleteTeam(userId: string, teamId: ObjectId): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId)
  return role === "owner"
}

export async function canInviteMembers(userId: string, teamId: ObjectId): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId)
  return role === "owner" || role === "admin"
}

export async function canManageProject(userId: string, projectId: ObjectId): Promise<boolean> {
  const projects = await getProjectsCollection()
  const project = await projects.findOne({ _id: projectId })

  if (!project) return false

  const role = await getUserTeamRole(userId, project.teamId)
  return role === "owner" || role === "admin"
}

export async function canDeleteProject(userId: string, projectId: ObjectId): Promise<boolean> {
  return canManageProject(userId, projectId)
}

export async function canAccessProject(userId: string, projectId: ObjectId): Promise<boolean> {
  const projects = await getProjectsCollection()
  const project = await projects.findOne({ _id: projectId })

  if (!project) return false

  const role = await getUserTeamRole(userId, project.teamId)
  return role !== null
}

export async function canCreateTask(userId: string, projectId: ObjectId): Promise<boolean> {
  return canAccessProject(userId, projectId)
}

export async function canEditTask(userId: string, projectId: ObjectId): Promise<boolean> {
  return canAccessProject(userId, projectId)
}

export async function canDeleteTask(userId: string, projectId: ObjectId): Promise<boolean> {
  return canAccessProject(userId, projectId)
}

export async function canManageColumns(userId: string, projectId: ObjectId): Promise<boolean> {
  return canManageProject(userId, projectId)
}
