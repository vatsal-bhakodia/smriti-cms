import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studyResources } from "@/db/schema";
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
    const [resource] = await db
      .select()
      .from(studyResources)
      .where(eq(studyResources.id, id))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch resource" },
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
    const { type, link } = body;

    const validTypes = ["notes", "pyq", "books", "practical"];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(studyResources)
      .set({
        type: type || undefined,
        link: link || undefined,
      })
      .where(eq(studyResources.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update resource" },
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
    await db.delete(studyResources).where(eq(studyResources.id, id));
    return NextResponse.json({ message: "Resource deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    );
  }
}
