"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/auth/client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { MessageSquare, Paperclip, Trash2, CheckSquare, Plus, AlertCircle, Link as LinkIcon, AtSign } from "lucide-react"
import { highlightMentions } from "@/lib/utils/mentions"
import { FileAttachments } from "./file-attachments"
import { AssigneeSelector } from "./assignee-selector"
import { DueDateSelector } from "./due-date-selector"

interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
}

interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  assignees: string[]
  labels: Array<{ name: string; color: string }>
  subtasks: Subtask[]
  dependencies: string[]
  blockedBy: string[]
  dueDate?: string
  priority?: string
  attachments: Array<{ url: string; filename: string; size: number }>
  commentsCount: number
}

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
}

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  onUpdate: () => void
}

export function TaskDialog({ open, onOpenChange, taskId, onUpdate }: TaskDialogProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [teamId, setTeamId] = useState<string>("")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [newSubtask, setNewSubtask] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && taskId) {
      loadTaskData()
    }
  }, [open, taskId])

  const loadTaskData = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        fetchWithAuth(`/api/tasks/${taskId}`),
        fetchWithAuth(`/api/tasks/${taskId}/comments`),
      ])

      if (taskRes.ok && commentsRes.ok) {
        const taskData = await taskRes.json()
        const commentsData = await commentsRes.json()
        setTask(taskData.task)

        // Load teamId from project
        if (taskData.task.projectId) {
          const projectRes = await fetchWithAuth(`/api/projects/${taskData.task.projectId}`)
          if (projectRes.ok) {
            const projectData = await projectRes.json()
            setTeamId(projectData.project.teamId)
          }
        }

        setComments(commentsData.comments)
      }
    } catch (error) {
      console.error("Failed to load task:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        setNewComment("")
        loadTaskData()
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onOpenChange(false)
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return

    try {
      const newSubtaskItem = {
        id: Math.random().toString(36).substring(7),
        title: newSubtask,
        completed: false,
        position: task.subtasks.length,
      }

      const updatedSubtasks = [...task.subtasks, newSubtaskItem]

      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      })

      setNewSubtask("")
      loadTaskData()
      onUpdate()
    } catch (error) {
      console.error("Failed to add subtask:", error)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!task) return

    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
    )

    try {
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      })

      loadTaskData()
      onUpdate()
    } catch (error) {
      console.error("Failed to toggle subtask:", error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task) return

    const updatedSubtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId)

    try {
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      })

      loadTaskData()
      onUpdate()
    } catch (error) {
      console.error("Failed to delete subtask:", error)
    }
  }

  const handleDueDateChange = async (date: string | null) => {
    try {
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: date }),
      })
      loadTaskData()
      onUpdate()
    } catch (error) {
      console.error("Failed to update due date:", error)
    }
  }

  if (!task) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              {task.description && <DialogDescription className="mt-2">{task.description}</DialogDescription>}
            </div>
            <Button variant="ghost" size="icon" onClick={handleDeleteTask}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label, idx) => (
                <Badge key={idx} style={{ backgroundColor: label.color }}>
                  {label.name}
                </Badge>
              ))}
            </div>
          )}

          {(task.dependencies.length > 0 || task.blockedBy.length > 0) && (
            <div>
              {task.dependencies.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-blue-600" />
                    Depends On
                  </p>
                  <p className="text-sm text-muted-foreground">{task.dependencies.length} task(s)</p>
                </div>
              )}
              {task.blockedBy.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium mb-1 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    Blocked By
                  </p>
                  <p className="text-sm text-muted-foreground">{task.blockedBy.length} task(s)</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {task.priority && (
              <div>
                <p className="text-sm font-medium mb-1">Priority</p>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">Due Date</p>
              <DueDateSelector dueDate={task.dueDate} onDateChange={handleDueDateChange} />
            </div>

            {teamId && (
              <div>
                <p className="text-sm font-medium mb-2">Assignees</p>
                <AssigneeSelector taskId={taskId} assignees={task.assignees} teamId={teamId} onUpdate={loadTaskData} />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Subtasks ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </p>
            </div>
            <div className="space-y-2 mb-3">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(subtask.id)}
                  />
                  <span className={`flex-1 text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
              />
              <Button size="icon" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <FileAttachments taskId={task.id} attachments={task.attachments} onUpdate={loadTaskData} />

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </p>
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border p-3">
                  <p 
                    className="text-sm" 
                    dangerouslySetInnerHTML={{ __html: highlightMentions(comment.content) }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment... (Use @username to mention someone)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
                Add Comment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
