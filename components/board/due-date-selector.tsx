"use client"

import { useState } from "react"
import { Calendar, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format, isPast, isToday, differenceInDays, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface DueDateSelectorProps {
  dueDate?: string
  onDateChange: (date: string | null) => void
}

export function DueDateSelector({ dueDate, onDateChange }: DueDateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dueDate ? parseISO(dueDate) : undefined,
  )

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onDateChange(format(date, "yyyy-MM-dd"))
    } else {
      onDateChange(null)
    }
    setOpen(false)
  }

  const getDueDateStatus = () => {
    if (!dueDate) return null

    const date = parseISO(dueDate)
    const daysUntilDue = differenceInDays(date, new Date())

    if (isPast(date) && !isToday(date)) {
      return { label: "Overdue", color: "text-red-600", icon: AlertCircle }
    } else if (isToday(date)) {
      return { label: "Due today", color: "text-orange-600", icon: Clock }
    } else if (daysUntilDue <= 3) {
      return { label: `Due in ${daysUntilDue} days`, color: "text-orange-600", icon: Clock }
    } else {
      return { label: `Due ${format(date, "MMM d")}`, color: "text-muted-foreground", icon: Calendar }
    }
  }

  const status = getDueDateStatus()

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            {dueDate ? format(parseISO(dueDate), "PPP") : "Set due date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} />
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  handleDateSelect(undefined)
                }}
              >
                Clear
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {status && (
        <div className={cn("flex items-center gap-2 text-xs", status.color)}>
          <status.icon className="h-3 w-3" />
          <span>{status.label}</span>
        </div>
      )}
    </div>
  )
}

