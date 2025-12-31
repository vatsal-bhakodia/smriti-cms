import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (programId) {
      const allSubjects = await db
        .select()
        .from(subjects)
        .where(eq(subjects.programId, programId));
      return NextResponse.json(allSubjects);
    }

    const allSubjects = await db.select().from(subjects);
    return NextResponse.json(allSubjects);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      programId,
      specializationId,
      semester,
      code,
      name,
      slug,
      theoryCredits,
      description,
      syllabus,
      practicalCredits,
      practicalTopics,
    } = body;

    if (!programId || !semester || !code || !name || !slug || !theoryCredits) {
      return NextResponse.json(
        {
          error:
            "Program ID, semester, code, name, slug, and theory credits are required",
        },
        { status: 400 }
      );
    }

    const [newSubject] = await db
      .insert(subjects)
      .values({
        programId,
        specializationId: specializationId || null,
        semester: parseInt(semester),
        code,
        name,
        slug,
        theoryCredits,
        description: description || null,
        syllabus: syllabus || null,
        practicalCredits: practicalCredits || null,
        practicalTopics: practicalTopics || null,
      })
      .returning();

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Subject with this slug already exists for this program/semester",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}
