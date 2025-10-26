"use client"

import { useState } from "react"
import { fetchWithAuth } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Upload, X, FileIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Attachment {
  url: string
  key: string
  filename: string
  size: number
}

interface FileAttachmentsProps {
  taskId: string
  attachments: Attachment[]
  onUpdate: () => void
}

export function FileAttachments({ taskId, attachments, onUpdate }: FileAttachmentsProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit")
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      // Upload file
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file")
      }

      const uploadData = await uploadRes.json()
      const newAttachment = uploadData.file

      // Add attachment to task
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: [...attachments, newAttachment],
        }),
      })

      onUpdate()
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("Failed to upload file")
    } finally {
      setUploading(false)
      setProgress(0)
      // Reset input
      event.target.value = ""
    }
  }

  const handleDeleteAttachment = async (index: number) => {
    try {
      const updatedAttachments = attachments.filter((_, i) => i !== index)
      await fetchWithAuth(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachments: updatedAttachments,
        }),
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to delete attachment:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments.length})
        </p>
        <div className="relative">
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border p-2 group hover:bg-accent transition-colors"
            >
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{attachment.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Uploading file...</p>
        </div>
      )}
    </div>
  )
}

