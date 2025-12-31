import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { programs } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get("universityId");

    let query = db.select().from(programs);
    if (universityId) {
      const allPrograms = await db
        .select()
        .from(programs)
        .where(eq(programs.universityId, universityId));
      return NextResponse.json(allPrograms);
    }

    const allPrograms = await db.select().from(programs);
    return NextResponse.json(allPrograms);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
