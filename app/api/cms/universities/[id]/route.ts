import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { universities } from "@/db/schema";
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
    const [university] = await db
      .select()
      .from(universities)
      .where(eq(universities.id, id))
      .limit(1);

    if (!university) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(university);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch university" },
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
    const { name, slug, location } = body;

    const [updated] = await db
      .update(universities)
      .set({
        name,
        slug,
        location: location || null,
      })
      .where(eq(universities.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "University with this name or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update university" },
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
    await db.delete(universities).where(eq(universities.id, id));
    return NextResponse.json({ message: "University deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete university" },
      { status: 500 }
    );
  }
}
