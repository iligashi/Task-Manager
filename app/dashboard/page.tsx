"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users } from "lucide-react"
import Link from "next/link"

interface Team {
  id: string
  name: string
  description?: string
  owner: string
  members: Array<{ userId: string; role: string }>
  createdAt: string
}

interface Project {
  id: string
  teamId: string
  name: string
  description?: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsRes, projectsRes] = await Promise.all([fetchWithAuth("/api/teams"), fetchWithAuth("/api/projects")])

        if (teamsRes.ok && projectsRes.ok) {
          const teamsData = await teamsRes.json()
          const projectsData = await projectsRes.json()
          setTeams(teamsData.teams)
          setProjects(projectsData.projects)
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Task Manager</h1>
          </div>
          <Button
            variant="ghost"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              localStorage.clear()
              router.push("/login")
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Teams</h2>
            <Link href="/teams/new">
              <Button className="gradient-primary hover:shadow-lg transition-all">
                <Plus className="mr-2 h-4 w-4" />
                New Team
              </Button>
            </Link>
          </div>
          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No teams yet</p>
                <Link href="/teams/new">
                  <Button>Create your first team</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team, idx) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="card-hover cursor-pointer bg-white border-2 border-blue-100 hover:border-blue-300">
                    <CardHeader>
                      <CardTitle className="text-gray-800">{team.name}</CardTitle>
                      {team.description && <CardDescription className="text-gray-600">{team.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-gray-600 font-medium">{team.members.length} members</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Projects</h2>
          </div>
          {projects.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600">No projects yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project, idx) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="card-hover cursor-pointer bg-white border-2 border-purple-100 hover:border-purple-300">
                    <CardHeader>
                      <CardTitle className="text-gray-800">{project.name}</CardTitle>
                      {project.description && <CardDescription className="text-gray-600">{project.description}</CardDescription>}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
