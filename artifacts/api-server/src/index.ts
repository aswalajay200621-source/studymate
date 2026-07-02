import fs from "fs";
try {
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  } else if (fs.existsSync("../../.env")) {
    process.loadEnvFile("../../.env");
  }
} catch (e) {}

import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "@workspace/db/migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run migrations on startup (CREATE TABLE IF NOT EXISTS — safe to re-run)
runMigrations().catch((err) => logger.error({ err }, "Migration startup error"));

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
