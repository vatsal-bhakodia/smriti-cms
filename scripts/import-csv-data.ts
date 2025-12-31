import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

// Now import database after env vars are loaded
import { db } from "../db";
import {
  specializations,
  subjects,
  subjectSpecializations,
} from "../db/schema";
import { generateSlug } from "../lib/utils";
import { eq, and } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

// CSV parsing function that handles multi-line JSON fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
      current += char;
    } else if (char === '"' && inQuotes && nextChar === '"') {
      // Escaped quote
      current += '""';
      i++; // Skip next quote
    } else if (char === '"' && inQuotes) {
      // Check if this is the end of a quoted field
      // Look ahead to see if next non-whitespace char is comma or end of line
      let j = i + 1;
      while (j < line.length && (line[j] === " " || line[j] === "\t")) j++;
      if (j >= line.length || line[j] === ",") {
        inQuotes = false;
        current += char;
      } else {
        current += char;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseJSONField(field: string): any {
  if (!field || field.trim() === "") return null;
  try {
    // Remove surrounding quotes if present
    const cleaned = field.replace(/^"|"$/g, "").replace(/""/g, '"');
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(`Failed to parse JSON field: ${field.substring(0, 50)}...`);
    return null;
  }
}

function parseSemester(semesterStr: string): number {
  // Convert "1st", "2nd", "3rd", "4th", etc. to numbers
  const match = semesterStr.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

interface CSVRow {
  semester: string;
  subject: string;
  subjectName: string;
  theoryPaperCode: string;
  labPaperCode: string;
  theoryCredits: string;
  labCredits: string;
  departments: string;
  theorySyllabus: string;
  labExperiments: string;
  notesCount: string;
  pyqCount: string;
  booksCount: string;
  practicalsCount: string;
  error: string;
  notesFileIds: string;
  pyqFileIds: string;
  booksFileIds: string;
  practicalsFileIds: string;
}

async function importCSVData() {
  const programId = "1c4983fa-8011-41dd-9cbc-d784641648fc";

  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL environment variable is not set!");
    process.exit(1);
  }

  // Debug: Verify we're connecting to Supabase
  const dbUrl = process.env.DATABASE_URL;
  const isSupabase = dbUrl.includes("supabase.com");
  console.log(
    `🔌 Database connection: ${isSupabase ? "Supabase ✅" : "⚠️  Not Supabase"}`
  );
  console.log(`   Host: ${dbUrl.match(/@([^:]+)/)?.[1] || "unknown"}`);

  console.log("📖 Reading CSV file...");
  const csvPath = path.join(process.cwd(), "data.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");

  if (lines.length < 2) {
    console.error("❌ CSV file is empty or has no data rows");
    process.exit(1);
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  console.log("📊 Parsing CSV data...");
  const rows: CSVRow[] = [];
  let currentLine = "";
  let lineIndex = 1;

  // Handle multi-line rows (JSON fields can span multiple lines)
  // We know there are 19 fields total, and JSON fields are in positions 8 and 9
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    currentLine += (currentLine ? "\n" : "") + line;

    // Try to parse the current line to see if we have all fields
    // A row is complete when we can successfully parse all 19 fields
    let isComplete = false;
    try {
      const testFields = parseCSVLine(currentLine);
      // Check if we have at least 19 fields (or close to it, accounting for parsing issues)
      // Also check if the last field seems complete (ends with quote or is not quoted)
      if (testFields.length >= 18) {
        const lastField = testFields[testFields.length - 1];
        const trimmed = currentLine.trim();
        // Row is complete if:
        // 1. We have enough fields AND
        // 2. The line ends properly (with a quote for last field, or last field is unquoted)
        if (
          trimmed.endsWith('"') ||
          (!lastField.startsWith('"') && trimmed.match(/[^"]$/))
        ) {
          isComplete = true;
        }
      }
    } catch (e) {
      // Parsing failed, row not complete yet
      isComplete = false;
    }

    if (isComplete && currentLine.length > 0) {
      try {
        const fields = parseCSVLine(currentLine);
        if (fields.length >= 9) {
          // Clean up fields (remove surrounding quotes)
          const cleanField = (f: string) => {
            let cleaned = f.trim();
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1);
            }
            // Unescape quotes
            cleaned = cleaned.replace(/""/g, '"');
            return cleaned;
          };

          const row: CSVRow = {
            semester: cleanField(fields[0] || ""),
            subject: cleanField(fields[1] || ""),
            subjectName: cleanField(fields[2] || ""),
            theoryPaperCode: cleanField(fields[3] || ""),
            labPaperCode: cleanField(fields[4] || ""),
            theoryCredits: cleanField(fields[5] || ""),
            labCredits: cleanField(fields[6] || ""),
            departments: cleanField(fields[7] || ""),
            theorySyllabus: fields[8] || "",
            labExperiments: fields[9] || "",
            notesCount: cleanField(fields[10] || ""),
            pyqCount: cleanField(fields[11] || ""),
            booksCount: cleanField(fields[12] || ""),
            practicalsCount: cleanField(fields[13] || ""),
            error: cleanField(fields[14] || ""),
            notesFileIds: cleanField(fields[15] || ""),
            pyqFileIds: cleanField(fields[16] || ""),
            booksFileIds: cleanField(fields[17] || ""),
            practicalsFileIds: cleanField(fields[18] || ""),
          };
          rows.push(row);
        }
      } catch (error) {
        console.warn(`⚠️  Error parsing line ${lineIndex}: ${error}`);
      }
      currentLine = "";
      lineIndex++;
    }
  }

  console.log(`✅ Parsed ${rows.length} rows from CSV`);

  // Extract unique departments (specializations)
  console.log("🔍 Extracting unique departments...");
  const departmentSet = new Set<string>();
  rows.forEach((row) => {
    if (row.departments) {
      const depts = row.departments
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      depts.forEach((dept) => departmentSet.add(dept));
    }
  });

  const uniqueDepartments = Array.from(departmentSet).sort();
  console.log(
    `✅ Found ${uniqueDepartments.length} unique departments:`,
    uniqueDepartments
  );

  // Create specializations
  console.log("📝 Creating specializations...");
  const specializationMap = new Map<string, string>(); // department name -> specialization id

  for (const dept of uniqueDepartments) {
    const slug = generateSlug(dept);

    // Check if specialization already exists
    const existing = await db
      .select()
      .from(specializations)
      .where(
        and(
          eq(specializations.programId, programId),
          eq(specializations.slug, slug)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(
        `   ⏭️  Specialization "${dept}" already exists (${existing[0].id})`
      );
      specializationMap.set(dept, existing[0].id);
    } else {
      try {
        const [spec] = await db
          .insert(specializations)
          .values({
            programId,
            name: dept,
            slug,
          })
          .returning();
        console.log(`   ✅ Created specialization: ${dept} (${spec.id})`);
        specializationMap.set(dept, spec.id);
      } catch (error: any) {
        console.error(
          `   ❌ Error creating specialization "${dept}":`,
          error.message
        );
      }
    }
  }

  // Create subjects and link to specializations
  console.log("📚 Creating subjects and linking to specializations...");
  const subjectMap = new Map<string, string>(); // subject slug -> subject id
  let subjectsCreated = 0;
  let linksCreated = 0;
  let subjectsSkipped = 0;
  let linksSkipped = 0;

  for (const row of rows) {
    if (!row.subject || !row.subjectName) {
      continue;
    }

    const subjectSlug = row.subject.trim();
    const subjectName = row.subjectName.trim();
    const theoryCode = row.theoryPaperCode.trim();
    const labCode = row.labPaperCode.trim();
    const theoryCredits = parseInt(row.theoryCredits) || 0;
    const labCredits = parseInt(row.labCredits) || 0;
    const semester = parseSemester(row.semester);

    if (semester === 0) {
      console.warn(`⚠️  Skipping row with invalid semester: ${row.semester}`);
      continue;
    }

    // Parse JSON fields
    const syllabus = parseJSONField(row.theorySyllabus);
    const practicalTopics = parseJSONField(row.labExperiments);

    // Get or create subject
    let subjectId = subjectMap.get(subjectSlug);

    if (!subjectId) {
      // Check if subject already exists in database
      const existing = await db
        .select()
        .from(subjects)
        .where(eq(subjects.slug, subjectSlug))
        .limit(1);

      if (existing.length > 0) {
        subjectId = existing[0].id;
        subjectMap.set(subjectSlug, subjectId);
      } else {
        // Create new subject
        try {
          const [subject] = await db
            .insert(subjects)
            .values({
              code: theoryCode || subjectSlug,
              name: subjectName,
              slug: subjectSlug,
              theoryCredits,
              practicalCredits: labCredits > 0 ? labCredits : null,
              syllabus: syllabus || null,
              practicalTopics: practicalTopics || null,
            })
            .returning();
          subjectId = subject.id;
          subjectMap.set(subjectSlug, subjectId);
          subjectsCreated++;
          console.log(`   ✅ Created subject: ${subjectName} (${subjectSlug})`);
        } catch (error: any) {
          console.error(
            `   ❌ Error creating subject "${subjectName}":`,
            error.message
          );
          if (error.cause) {
            console.error(`      Cause: ${error.cause.message || error.cause}`);
          }
          console.error(`      Details:`, {
            code: subjectSlug,
            slug: subjectSlug,
          });
          continue;
        }
      }
    } else {
      subjectsSkipped++;
    }

    // Link subject to specializations
    if (row.departments) {
      const depts = row.departments
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      for (const dept of depts) {
        const specId = specializationMap.get(dept);
        if (!specId) {
          console.warn(`⚠️  Specialization not found for department: ${dept}`);
          continue;
        }

        // Check if link already exists
        const existingLink = await db
          .select()
          .from(subjectSpecializations)
          .where(
            and(
              eq(subjectSpecializations.subjectId, subjectId),
              eq(subjectSpecializations.specializationId, specId),
              eq(subjectSpecializations.semester, semester)
            )
          )
          .limit(1);

        if (existingLink.length > 0) {
          linksSkipped++;
        } else {
          try {
            await db.insert(subjectSpecializations).values({
              subjectId,
              specializationId: specId,
              semester,
            });
            linksCreated++;
          } catch (error: any) {
            console.error(
              `   ❌ Error linking subject to specialization "${dept}":`,
              error.message
            );
            linksSkipped++;
          }
        }
      }
    }
  }

  console.log("\n📊 Import Summary:");
  console.log(
    `   Specializations: ${uniqueDepartments.length} unique departments`
  );
  console.log(`   Subjects created: ${subjectsCreated}`);
  console.log(`   Subjects skipped (already exist): ${subjectsSkipped}`);
  console.log(`   Subject-Specialization links created: ${linksCreated}`);
  console.log(`   Links skipped (already exist): ${linksSkipped}`);
  console.log("\n✅ Import completed successfully!");
}

importCSVData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error during import:", error);
    process.exit(1);
  });
