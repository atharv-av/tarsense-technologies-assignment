import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: "Hello World!" });
  } catch (error) {
    console.error(error);
  }
}
