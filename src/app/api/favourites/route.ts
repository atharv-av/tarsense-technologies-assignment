import dbConnect from "@/lib/mongodb";
import Note from "@/models/Note";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const notes = await Note.find({ userId: decoded.userId });

    const favourites = notes.filter((note) => note.isFavorite === true);

    console.log("Favourites:", favourites);

    return NextResponse.json(favourites);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
