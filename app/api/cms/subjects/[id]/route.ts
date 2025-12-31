import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
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

    const [updated] = await db
      .update(subjects)
      .set({
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
      .where(eq(subjects.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
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
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const { id } = await params;
    await db.delete(subjects).where(eq(subjects.id, id));
    return NextResponse.json({ message: "Subject deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
