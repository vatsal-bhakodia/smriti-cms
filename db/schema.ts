import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
  jsonb,
} from "drizzle-orm/pg-core";

export const universities = pgTable("universities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const programs = pgTable(
  "programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    universityId: uuid("university_id")
      .notNull()
      .references(() => universities.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // BTech, BCA
    slug: text("slug").notNull(),
    hasSpecialization: boolean("has_specialization").default(false),
    semesterCount: integer("semester_count").default(8), // Number of semesters

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.universityId, table.slug)]
);

export const specializations = pgTable(
  "specializations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // Computer Science
    slug: text("slug").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.programId, table.slug)]
);

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),

  code: text("code").notNull(), // CS301
  name: text("name").notNull(), // Data Structures
  slug: text("slug").notNull(),
  theoryCredits: integer("theory_credits").notNull(),

  description: text("description"),
  syllabus: jsonb("syllabus"), // JSON column for syllabus

  practicalCredits: integer("practical_credits"), // Credits for practical/lab component
  practicalTopics: jsonb("practical_topics"), // JSON column for topics/experiments

  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for subjects to programs (many-to-many)
export const subjectPrograms = pgTable(
  "subject_programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    programId: uuid("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(), // 1, 2, 3, etc.

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.subjectId, table.programId, table.semester)]
);

// Junction table for subjects to specializations (many-to-many)
export const subjectSpecializations = pgTable(
  "subject_specializations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    specializationId: uuid("specialization_id")
      .notNull()
      .references(() => specializations.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(), // 1, 2, 3, etc.

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique().on(table.subjectId, table.specializationId, table.semester),
  ]
);

export const resourceTypeEnum = pgEnum("resource_type", [
  "notes",
  "pyq",
  "books",
  "practical",
]);

export const storageTypeEnum = pgEnum("storage_type", [
  "google_drive",
  "cloudinary",
  "url",
]);

export const studyResources = pgTable("study_resources", {
  id: uuid("id").defaultRandom().primaryKey(),

  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  type: resourceTypeEnum("type").notNull(),
  storageType: storageTypeEnum("storage_type").notNull(),
  link: text("link").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
