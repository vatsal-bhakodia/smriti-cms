import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedUser() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ Error: DATABASE_URL environment variable is not set!");
    console.error(
      "Please create a .env file with your database connection string."
    );
    console.error(
      "Example: DATABASE_URL=postgresql://user:password@localhost:5432/database_name"
    );
    process.exit(1);
  } else {
    console.log(process.env.DATABASE_URL);
  }

  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin User";

  if (!email || !password) {
    console.error("❌ Error: Email and password are required!");
    console.error("Usage: npm run seed:user <email> <password> [name]");
    process.exit(1);
  }

  console.log("🔐 Hashing password...");
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(hashedPassword);
  try {
    console.log("📝 Creating user in database...");

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    } catch (selectError: any) {
      console.error("\n❌ Error checking existing user:");
      console.error("Full error:", JSON.stringify(selectError, null, 2));
      throw selectError;
    }

    if (existingUser.length > 0) {
      console.error("\n❌ Error: User with this email already exists");
      console.error(`   Email: ${email}`);
      process.exit(1);
    }

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: "admin",
      })
      .returning();

    console.log("\n✅ User created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n🎉 You can now login at http://localhost:3000/login`);
  } catch (error: any) {
    console.error("\n❌ Error creating user:");

    // Log full error details for debugging
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.message) {
      console.error(`   Message: ${error.message}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    if (error.hint) {
      console.error(`   Hint: ${error.hint}`);
    }

    // Specific error handling
    if (error.code === "23505") {
      console.error("\n❌ User with this email already exists");
      console.error(`   Email: ${email}`);
    } else if (
      error.code === "28P01" ||
      error.message?.includes("password authentication")
    ) {
      console.error(
        "\n❌ Database connection error: Password authentication failed"
      );
      console.error("   Please check your DATABASE_URL in the .env file");
      console.error("   Make sure your database credentials are correct");
    } else if (error.message?.includes("connect ECONNREFUSED")) {
      console.error(
        "\n❌ Database connection error: Could not connect to database"
      );
      console.error("   Please make sure your PostgreSQL database is running");
      console.error("   Check your DATABASE_URL in the .env file");
    } else if (error.code === "42P01") {
      console.error("\n❌ Table 'users' does not exist");
      console.error("   Please run database migrations first:");
      console.error("   npm run db:migrate");
    } else if (error.code === "42703") {
      console.error("\n❌ Column does not exist in database");
      console.error("   The database schema may be out of sync");
      console.error("   Please run database migrations:");
      console.error("   npm run db:migrate");
    }

    // Log the full error object if available
    if (process.env.DEBUG) {
      console.error("\nFull error object:");
      console.error(JSON.stringify(error, null, 2));
    }

    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedUser();
