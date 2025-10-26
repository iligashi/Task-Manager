import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { requireAuth } from "@/lib/auth/middleware"

// POST /api/uploads - Upload a file
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({
      message: "File uploaded successfully",
      file: {
        url: blob.url,
        key: blob.pathname,
        filename: file.name,
        size: file.size,
        contentType: file.type,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "File upload failed" }, { status: 500 })
  }
}
