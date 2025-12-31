import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Load dotenv if running outside Next.js context (e.g., in scripts)
if (!process.env.NEXT_RUNTIME) {
  try {
    const dotenv = require("dotenv");
    dotenv.config();
  } catch (e) {
    // dotenv might not be available in production builds
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set!");
}

// Disable prefetch as it is not compatible with "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
