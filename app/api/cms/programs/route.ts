import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const allPrograms = await db.select().from(programs);
    return NextResponse.json(allPrograms);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { universityId, name, slug, hasSpecialization, semesterCount } = body;

    if (!universityId || !name || !slug) {
      return NextResponse.json(
        { error: "University ID, name, and slug are required" },
        { status: 400 }
      );
    }

    const [newProgram] = await db
      .insert(programs)
      .values({
        universityId,
        name,
        slug,
        hasSpecialization: hasSpecialization || false,
        semesterCount: semesterCount ? parseInt(semesterCount) : 8,
      })
      .returning();

    return NextResponse.json(newProgram, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Program with this slug already exists for this university" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 }
    );
  }
}
