import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const formData = await request.formData();

    const updateData: {
      title?: string;
      content?: string;
      isFavorite?: boolean;
      images?: { url: string; caption: string }[];
    } = {};

    // Handle text fields
    if (formData.has("title")) {
      const title = formData.get("title");
      if (title) updateData.title = title.toString();
    }
    if (formData.has("content")) {
      const content = formData.get("content");
      if (content) updateData.content = content.toString();
    }
    if (formData.has("isFavorite"))
      updateData.isFavorite = formData.get("isFavorite") === "true";

    // Handle existing images
    const existingImages = formData.getAll("existingImages");
    updateData.images = existingImages.map((img) => JSON.parse(img.toString()));

    // Handle new image files
    const imageFiles = formData.getAll("newImages") as File[];
    const imageCaptions = formData.getAll("newImageCaptions") as string[];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const caption = imageCaptions[i] || "";

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${uuidv4()}${path.extname(file.name)}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      updateData.images.push({ url: `/uploads/${fileName}`, caption });
    }

    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId: decoded.userId },
      { $set: updateData },
      { new: true }
    );

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    const note = await Note.findOneAndDelete({
      _id: params.id,
      userId: decoded.userId,
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
