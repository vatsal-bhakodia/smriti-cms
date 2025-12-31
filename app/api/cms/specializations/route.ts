import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { specializations } from "@/db/schema";
import { requireAuth } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const error = await requireAuth(request);
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

export async function POST(request: NextRequest) {
  const error = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { programId, name, slug } = body;

    if (!programId || !name || !slug) {
      return NextResponse.json(
        { error: "Program ID, name, and slug are required" },
        { status: 400 }
      );
    }

    const [newSpecialization] = await db
      .insert(specializations)
      .values({
        programId,
        name,
        slug,
      })
      .returning();

    return NextResponse.json(newSpecialization, { status: 201 });
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
      { error: "Failed to create specialization" },
      { status: 500 }
    );
  }
}
