import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { specializations } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (programId) {
      const allSpecializations = await db
        .select()
        .from(specializations)
        .where(eq(specializations.programId, programId));
      return NextResponse.json(allSpecializations);
    }

    const allSpecializations = await db.select().from(specializations);
    return NextResponse.json(allSpecializations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch specializations" },
      { status: 500 }
    );
  }
}
