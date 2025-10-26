"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/auth/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, Clock, Users, TrendingUp, AlertTriangle } from "lucide-react"
import { formatDistanceToNow, subDays, format } from "date-fns"

interface Task {
  id: string
  title: string
  columnId: string
  priority?: string
  dueDate?: string
  assignees: string[]
  completed: boolean
  createdAt: string
}

interface Analytics {
  totalTasks: number
  completedTasks: number
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  averageCompletionTime: number
  tasksDueSoon: number
}

export default function AnalyticsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [teamId])

  const loadAnalytics = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetchWithAuth(`/api/projects?teamId=${teamId}`),
        fetchWithAuth(`/api/tasks?teamId=${teamId}`),
      ])

      if (projectsRes.ok && tasksRes.ok) {
        const projectsData = await projectsRes.json()
        const tasksData = await tasksRes.json()

        // Calculate analytics
        const tasks = tasksData.tasks || []
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: Task) => t.columnId === "Done").length
        const tasksByStatus: Record<string, number> = {}
        const tasksByPriority: Record<string, number> = {}

        tasks.forEach((task: Task) => {
          const status = task.columnId
          tasksByStatus[status] = (tasksByStatus[status] || 0) + 1

          const priority = task.priority || "none"
          tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1
        })

        // Calculate tasks due soon (within 7 days)
        const now = new Date()
        const sevenDaysFromNow = subDays(now, -7)
        const tasksDueSoon = tasks.filter((task: Task) => {
          if (!task.dueDate) return false
          const dueDate = new Date(task.dueDate)
          return dueDate <= sevenDaysFromNow && dueDate >= now
        }).length

        setAnalytics({
          totalTasks,
          completedTasks,
          tasksByStatus,
          tasksByPriority,
          averageCompletionTime: 0, // TODO: calculate from activity logs
          tasksDueSoon,
        })
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to load analytics:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const completionRate = analytics.totalTasks > 0 
    ? ((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1)
    : "0"

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your team's productivity and progress</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedTasks} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Tasks completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Due Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.tasksDueSoon}</div>
              <p className="text-xs text-muted-foreground">
                Due in next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.tasksByStatus["In Progress"] || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active tasks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">{status}</span>
                  </div>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm capitalize">{priority}</span>
                  </div>
                  <Badge>{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

