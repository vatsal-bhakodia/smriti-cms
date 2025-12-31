import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { semester } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";
import { eq, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");
    const specializationId = searchParams.get("specializationId");

    if (programId || specializationId) {
      const conditions = [];
      if (programId) {
        conditions.push(eq(semester.programId, programId));
      }
      if (specializationId) {
        conditions.push(eq(semester.specializationId, specializationId));
      }
      const allSemesters = await db
        .select()
        .from(semester)
        .where(or(...conditions));
      return NextResponse.json(allSemesters);
    }

    const allSemesters = await db.select().from(semester);
    return NextResponse.json(allSemesters);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    );
  }
}
