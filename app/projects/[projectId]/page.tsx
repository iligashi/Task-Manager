"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TaskCard } from "@/components/board/task-card"
import { CreateTaskDialog } from "@/components/board/create-task-dialog"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Column {
  id: string
  title: string
  position: number
}

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

interface Project {
  id: string
  teamId: string
  name: string
  description?: string
  columns: Column[]
}

// Sortable Column Component
function SortableColumn({ column, tasks, onCreateTask }: { column: Column; tasks: Task[]; onCreateTask: (id: string) => void }) {
  const { setNodeRef, attributes, listeners } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  })

  // Different colors for different columns
  const getColumnStyle = (title: string) => {
    if (title.includes("To Do")) {
      return "border-blue-300 bg-blue-50/50"
    } else if (title.includes("Progress")) {
      return "border-orange-300 bg-orange-50/50"
    } else if (title.includes("Done")) {
      return "border-green-300 bg-green-50/50"
    }
    return "border-purple-300 bg-purple-50/50"
  }

  return (
    <Card ref={setNodeRef} {...attributes} className={`flex-shrink-0 w-80 border-2 ${getColumnStyle(column.title)} bg-white shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4" {...listeners}>
        <CardTitle className="text-base font-bold text-gray-800">{column.title}</CardTitle>
        <span className="text-sm font-semibold bg-white px-2 py-1 rounded-full">{tasks.length}</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-white/50"
          onClick={() => onCreateTask(column.id)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add task
        </Button>
      </CardContent>
    </Card>
  )
}

// Sortable Task Component
function SortableTask({ task }: { task: Task }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      columnId: task.columnId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? "opacity-50" : ""}>
      <TaskCard task={task} onUpdate={() => {}} />
    </div>
  )
}

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState<string>("")
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const loadData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        fetchWithAuth(`/api/projects/${projectId}`),
        fetchWithAuth(`/api/tasks?projectId=${projectId}`),
      ])

      if (projectRes.ok && tasksRes.ok) {
        const projectData = await projectRes.json()
        const tasksData = await tasksRes.json()
        setProject(projectData.project)
        setTasks(tasksData.tasks)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Failed to load project:", error)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId, router])

  const handleCreateTask = (columnId: string) => {
    setSelectedColumnId(columnId)
    setCreateDialogOpen(true)
  }

  const handleTaskCreated = () => {
    loadData()
    setCreateDialogOpen(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newColumnId = over.id as string
    const draggedTask = tasks.find((t) => t.id === taskId)

    // Don't do anything if dropped in the same column
    if (draggedTask?.columnId === newColumnId) return

    // Only update if dropped on a different column
    if (project?.columns.some((col) => col.id === newColumnId)) {
      try {
        await fetchWithAuth(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columnId: newColumnId }),
        })

        // Optimistically update the UI
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, columnId: newColumnId } : task)),
        )
      } catch (error) {
        console.error("Failed to move task:", error)
        loadData() // Reload on error
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="hover:bg-blue-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-600">{project.description}</p>}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {project.columns
              .sort((a, b) => a.position - b.position)
              .map((column) => {
                const columnTasks = tasks
                  .filter((t) => t.columnId === column.id)
                  .sort((a, b) => a.position - b.position)

                return (
                  <SortableColumn
                    key={column.id}
                    column={column}
                    tasks={columnTasks}
                    onCreateTask={handleCreateTask}
                  />
                )
              })}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onUpdate={() => {}} />}
          </DragOverlay>
        </DndContext>
      </main>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        columnId={selectedColumnId}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}
