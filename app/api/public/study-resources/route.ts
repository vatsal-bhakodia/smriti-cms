import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { studyResources } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
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
