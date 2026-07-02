import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";

try {
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  } else if (fs.existsSync("../../.env")) {
    process.loadEnvFile("../../.env");
  }
} catch (e) {}

const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL must be set.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl: { rejectUnauthorized: false },
  },
});
