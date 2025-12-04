import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "file:./data/tech-upkeep.db";
const isPostgres =
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres ? { url: databaseUrl } : { url: databaseUrl },
});
