import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studyResources } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (subjectId) {
      const allResources = await db
        .select()
        .from(studyResources)
        .where(eq(studyResources.subjectId, subjectId));
      return NextResponse.json(allResources);
    }

    const allResources = await db.select().from(studyResources);
    return NextResponse.json(allResources);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch study resources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { subjectId, type, link } = body;

    if (!subjectId || !type || !link) {
      return NextResponse.json(
        { error: "Subject ID, type, and link are required" },
        { status: 400 }
      );
    }

    const validTypes = ["notes", "pyq", "books", "practical"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    const [newResource] = await db
      .insert(studyResources)
      .values({
        subjectId,
        type,
        link,
      })
      .returning();

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create study resource" },
      { status: 500 }
    );
  }
}
