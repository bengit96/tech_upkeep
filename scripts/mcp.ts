#!/usr/bin/env tsx
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { z } from "zod";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const repoRoot = process.cwd();
const drizzleDir = path.join(repoRoot, "drizzle");
const journalPath = path.join(drizzleDir, "meta", "_journal.json");

const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? postgres(databaseUrl, { prepare: false }) : null;

const server = new Server(
  { name: "tech-upkeep-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.tool("list_migrations", {}, async () => {
  const entries = await fs.readdir(drizzleDir);
  const files = entries.filter((f) => f.endsWith(".sql"));
  return { files };
});

server.tool("get_migration_journal", {}, async () => {
  const content = await fs.readFile(journalPath, "utf8");
  return { journal: JSON.parse(content) };
});

server.tool(
  "read_migration_file",
  { file: z.string().regex(/^\d{4}_.+\.sql$/) },
  async ({ file }) => {
    const full = path.join(drizzleDir, file);
    const data = await fs.readFile(full, "utf8");
    return { content: data };
  }
);

server.tool("sql_select", { query: z.string() }, async ({ query }) => {
  if (!sql) throw new Error("DATABASE_URL not set");
  if (!/^(\s*)(select|explain)\b/i.test(query)) {
    throw new Error("Only SELECT/EXPLAIN allowed");
  }
  const rows = await sql.unsafe(query);
  return { rows };
});

server.tool("drizzle_migration_health", {}, async () => {
  const journal = JSON.parse(await fs.readFile(journalPath, "utf8"));
  const entries: Array<{ tag: string }> = journal.entries || [];
  const tags = new Set(entries.map((e) => e.tag));
  const files = (await fs.readdir(drizzleDir)).filter((f) =>
    f.endsWith(".sql")
  );
  const missing = Array.from(tags).filter(
    (t) => !files.some((f) => f.startsWith(t))
  );
  const extra = files.filter(
    (f) => !Array.from(tags).some((t) => f.startsWith(t))
  );
  return {
    journalTags: Array.from(tags),
    files,
    missingFilesForTags: missing,
    extraFilesNotInJournal: extra,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);



