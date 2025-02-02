import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import dbConnect from "@/lib/mongodb"
import Note from "@/models/Note"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const formData = await request.formData()

    const updateData: any = {}

    // Handle text fields
    if (formData.has("title")) updateData.title = formData.get("title")
    if (formData.has("content")) updateData.content = formData.get("content")
    if (formData.has("isFavorite")) updateData.isFavorite = formData.get("isFavorite") === "true"

    // Handle image file
    const imageFile = formData.get("image") as File
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const fileName = `${uuidv4()}${path.extname(imageFile.name)}`
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      const filePath = path.join(uploadDir, fileName)

      await writeFile(filePath, buffer)
      updateData.images = [{ url: `/uploads/${fileName}`, caption: "" }]
    }

    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId: decoded.userId },
      { $set: updateData },
      { new: true },
    )

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Update note error:", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const note = await Note.findOneAndDelete({
      _id: params.id,
      userId: decoded.userId,
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Delete note error:", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

