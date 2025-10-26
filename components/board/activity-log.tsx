"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/auth/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  action: string
  actor: {
    id: string
    name: string
  }
  meta: Record<string, any>
  createdAt: string
}

interface ActivityLogProps {
  teamId: string
}

export function ActivityLog({ teamId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [teamId])

  const loadActivities = async () => {
    try {
      const response = await fetchWithAuth(`/api/teams/${teamId}/activity?limit=20`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error("Failed to load activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string, meta: Record<string, any>) => {
    switch (action) {
      case "task.created":
        return `created task "${meta.taskTitle}"`
      case "task.moved":
        return `moved task "${meta.taskTitle}" from ${meta.fromColumn} to ${meta.toColumn}`
      case "task.deleted":
        return `deleted task "${meta.taskTitle}"`
      case "task.updated":
        return `updated task "${meta.taskTitle}"`
      default:
        return action.replace("task.", "").replace(".", " ")
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-500"
    if (action.includes("moved")) return "bg-blue-500"
    if (action.includes("deleted")) return "bg-red-500"
    return "bg-gray-500"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`${getActionColor(activity.action)} w-1 rounded-full`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{activity.actor.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {getActionLabel(activity.action, activity.meta)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

