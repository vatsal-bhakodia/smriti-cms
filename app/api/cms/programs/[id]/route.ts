import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { programs } from "@/db/schema";
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
    const [program] = await db
      .select()
      .from(programs)
      .where(eq(programs.id, id))
      .limit(1);

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch program" },
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
    const { universityId, name, slug, hasSpecialization, semesterCount } = body;

    const [updated] = await db
      .update(programs)
      .set({
        universityId,
        name,
        slug,
        hasSpecialization: hasSpecialization || false,
        semesterCount: semesterCount ? parseInt(semesterCount) : 8,
      })
      .where(eq(programs.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Program with this slug already exists for this university" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update program" },
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
    await db.delete(programs).where(eq(programs.id, id));
    return NextResponse.json({ message: "Program deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}
