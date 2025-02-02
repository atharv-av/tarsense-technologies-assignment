import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import dbConnect from "@/lib/mongodb"
import Note from "@/models/Note"

export async function POST(req: Request) {
  try {
    await dbConnect()
    const token = req.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const formData = await req.formData()

    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const isAudio = formData.get("isAudio") === "true"
    const duration = formData.get("duration") as string
    const audioFile = formData.get("audio") as File

    let audioUrl = ""

    if (audioFile) {
      const bytes = await audioFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Create unique filename for audio
      const fileName = `${uuidv4()}.wav`
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      const filePath = path.join(uploadDir, fileName)

      // Save audio file
      await writeFile(filePath, buffer)
      audioUrl = `/uploads/${fileName}`
    }

    const note = await Note.create({
      title,
      content,
      userId: decoded.userId,
      isAudio,
      audioUrl: audioUrl || undefined,
      duration: duration || undefined,
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect()
    const token = req.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const notes = await Note.find({ userId: decoded.userId }).sort({ createdAt: -1 })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

