import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Truncating users table...");
  await db.execute(sql`TRUNCATE TABLE users CASCADE;`);
  console.log("Truncated successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
