"use client"

import { useState, useEffect } from "react"
import { fetchWithAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  email?: string
  avatarUrl?: string
}

interface AssigneeSelectorProps {
  taskId: string
  assignees: string[]
  teamId: string
  onUpdate: () => void
}

export function AssigneeSelector({ taskId, assignees, teamId, onUpdate }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamMembers()
  }, [teamId])

  const loadTeamMembers = async () => {
    try {
      const response = await fetchWithAuth(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        // Include owner and members in the assignable list
        const members: User[] = [
          // Owner
          {
            id: data.team.owner.id,
            name: data.team.owner.name || "User",
            email: data.team.owner.email,
            avatarUrl: data.team.owner.avatarUrl,
          },
          // Regular members
          ...data.team.members.map((member: any) => ({
            id: member.userId,
            name: member.name || "User",
            email: member.email,
            avatarUrl: member.avatarUrl,
          })),
        ]
        setTeamMembers(members)
      }
    } catch (error) {
      console.error("Failed to load team members:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAssignee = async (userId: string) => {
    const isAssigned = assignees.includes(userId)
    const updatedAssignees = isAssigned
      ? assignees.filter((id) => id !== userId)
      : [...assignees, userId]

    try {
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignees: updatedAssignees }),
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to update assignees:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Assignees ({assignees.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">Team Members</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members found</p>
          ) : (
            <div className="space-y-1">
              {teamMembers.map((member) => {
                const isAssigned = assignees.includes(member.id)
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => toggleAssignee(member.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {member.email && (
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      )}
                    </div>
                    {isAssigned && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

