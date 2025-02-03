import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const fileName = `${uuidv4()}${path.extname(file.name)}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    const filePath = path.join(uploadDir, fileName)

    // Ensure upload directory exists
    await writeFile(filePath, buffer)

    // Return the URL that can be used to access the file
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

