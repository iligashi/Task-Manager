"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

interface TeamMember {
  userId: string
  role: string
  name?: string
  email?: string
}

interface Team {
  id: string
  name: string
  description?: string
  owner: string
  members: TeamMember[]
}

interface Project {
  id: string
  name: string
  description?: string
}

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = localStorage.getItem("user")
        if (user) {
          setCurrentUserId(JSON.parse(user).id)
        }

        const [teamRes, projectsRes] = await Promise.all([
          fetchWithAuth(`/api/teams/${teamId}`),
          fetchWithAuth(`/api/projects?teamId=${teamId}`),
        ])

        if (teamRes.ok && projectsRes.ok) {
          const teamData = await teamRes.json()
          const projectsData = await projectsRes.json()
          setTeam(teamData.team)
          setProjects(projectsData.projects)
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Failed to load team:", error)
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [teamId, router])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      const response = await fetchWithAuth(`/api/teams/${teamId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (response.ok) {
        setInviteEmail("")
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to invite member")
      }
    } catch (error) {
      console.error("Failed to invite member:", error)
    }
  }

  const handleCreateProject = async () => {
    const name = prompt("Enter project name:")
    if (!name) return

    try {
      const response = await fetchWithAuth("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, name }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/projects/${data.project.id}`)
      }
    } catch (error) {
      console.error("Failed to create project:", error)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return

    try {
      const response = await fetchWithAuth(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/dashboard")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete team")
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!team) return null

  const currentUserRole = team.members.find((m) => m.userId === currentUserId)?.role
  const isOwner = currentUserRole === "owner"
  const isAdmin = currentUserRole === "admin" || isOwner

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">{team.name}</h1>
              {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
            </div>
          </div>
          {isOwner && (
            <Button variant="destructive" onClick={handleDeleteTeam}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Team
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <Button onClick={handleCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={handleCreateProject}>Create your first project</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      {project.description && <CardDescription>{project.description}</CardDescription>}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Team Members</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Members ({team.members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <span className="text-sm capitalize px-2 py-1 rounded-md bg-secondary">{member.role}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Member</CardTitle>
                  <CardDescription>Add new members to your team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteRole} onValueChange={(value: "admin" | "member") => setInviteRole(value)}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                    Send Invite
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
