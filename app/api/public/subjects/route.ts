import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get("termId");

    if (termId) {
      const allSubjects = await db
        .select()
        .from(subjects)
        .where(eq(subjects.termId, termId));
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
