"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MessageSquare, CheckSquare, AlertCircle, Link as LinkIcon } from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { useState } from "react"

interface Task {
  id: string
  projectId: string
  columnId: string
  title: string
  description?: string
  assignees: string[]
  labels: Array<{ name: string; color: string }>
  subtasks: Array<{ id: string; title: string; completed: boolean; position: number }>
  dependencies: string[]
  blockedBy: string[]
  dueDate?: string
  priority?: string
  position: number
  commentsCount: number
}

interface TaskCardProps {
  task: Task
  onUpdate: () => void
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Card 
        className="cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-lg card-hover bg-white border-2 border-gray-200" 
        onClick={() => setDialogOpen(true)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-800">{task.title}</CardTitle>
          {task.description && <CardDescription className="text-xs line-clamp-2 text-gray-600">{task.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-2">
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs" style={{ backgroundColor: label.color }}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {task.subtasks.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                </div>
              )}
              {(task.dependencies.length > 0 || task.blockedBy.length > 0) && (
                <div className="flex items-center gap-1">
                  {task.blockedBy.length > 0 && (
                    <AlertCircle className="h-3 w-3 text-orange-600" title="Blocked" />
                  )}
                  {task.dependencies.length > 0 && (
                    <LinkIcon className="h-3 w-3 text-blue-600" title="Has Dependencies" />
                  )}
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              {task.commentsCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {task.commentsCount}
                </div>
              )}
            </div>
            {task.priority && (
              <Badge variant="outline" className="text-xs">
                {task.priority}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} taskId={task.id} onUpdate={onUpdate} />
    </>
  )
}
