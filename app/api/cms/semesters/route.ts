import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { semester } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const allSemesters = await db.select().from(semester);
    return NextResponse.json(allSemesters);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { programId, specializationId, number } = body;

    if (!number) {
      return NextResponse.json(
        { error: "Semester number is required" },
        { status: 400 }
      );
    }

    const [newSemester] = await db
      .insert(semester)
      .values({
        programId: programId || null,
        specializationId: specializationId || null,
        number: parseInt(number),
      })
      .returning();

    return NextResponse.json(newSemester, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create semester" },
      { status: 500 }
    );
  }
}
