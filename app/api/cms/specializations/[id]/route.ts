import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { specializations } from "@/db/schema";
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
    const [specialization] = await db
      .select()
      .from(specializations)
      .where(eq(specializations.id, id))
      .limit(1);

    if (!specialization) {
      return NextResponse.json(
        { error: "Specialization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(specialization);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch specialization" },
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
    const { name, slug } = body;

    const [updated] = await db
      .update(specializations)
      .set({
        name,
        slug,
      })
      .where(eq(specializations.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Specialization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Specialization with this slug already exists for this program",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update specialization" },
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
    await db.delete(specializations).where(eq(specializations.id, id));
    return NextResponse.json({ message: "Specialization deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete specialization" },
      { status: 500 }
    );
  }
}
