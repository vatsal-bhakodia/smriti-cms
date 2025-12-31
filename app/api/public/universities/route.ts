import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { universities } from "@/db/schema";
import { restrictToGetOnly } from "@/lib/api-middleware";

export async function GET(request: NextRequest) {
  const error = restrictToGetOnly(request);
  if (error) return error;

  try {
    const allUniversities = await db.select().from(universities);
    return NextResponse.json(allUniversities);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 }
    );
  }
}
