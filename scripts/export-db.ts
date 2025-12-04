/**
 * Export data from local SQLite database to JSON files
 * Run with: npx tsx scripts/export-db.ts
 */

import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

let databaseUrl = process.env.DATABASE_URL || "file:./data/tech-upkeep.db";

// Strip query parameters from PostgreSQL URLs (not compatible with LibSQL)
if (databaseUrl.includes("?")) {
  databaseUrl = databaseUrl.split("?")[0];
}

// Only export from SQLite databases
if (
  databaseUrl.startsWith("postgres://") ||
  databaseUrl.startsWith("postgresql://")
) {
  console.error("❌ This script only works with SQLite databases");
  console.error(
    "💡 To export from PostgreSQL, use pg_dump or modify your .env to point to SQLite"
  );
  process.exit(1);
}

// Create SQLite client
const client = createClient({
  url: databaseUrl,
});

// Tables to export (in dependency order)
const tables = [
  "users",
  "categories",
  "tags",
  "sources",
  "scrape_batches",
  "content",
  "content_tags",
  "user_category_preferences",
  "user_tag_preferences",
  "newsletter_sends",
  "click_tracking",
  "newsletter_config",
  "otp_tokens",
];

async function exportData() {
  console.log("📦 Starting database export...\n");

  // Create export directory
  const exportDir = path.join(process.cwd(), "db-export");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const exportData: Record<string, any[]> = {};
  let totalRecords = 0;

  // Export each table
  for (const table of tables) {
    try {
      console.log(`📄 Exporting ${table}...`);
      const result = await client.execute(`SELECT * FROM ${table}`);
      const rows = result.rows;

      exportData[table] = rows.map((row) => {
        // Convert row to object
        const obj: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          obj[key] = value;
        }
        return obj;
      });

      console.log(`   ✅ Exported ${rows.length} records from ${table}`);
      totalRecords += rows.length;
    } catch (error: any) {
      if (error.message?.includes("no such table")) {
        console.log(`   ⏭️  Table ${table} doesn't exist, skipping...`);
        exportData[table] = [];
      } else {
        console.error(`   ❌ Error exporting ${table}:`, error.message);
        exportData[table] = [];
      }
    }
  }

  // Write to JSON file
  const exportPath = path.join(exportDir, `export-${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

  console.log(`\n✅ Export complete!`);
  console.log(`📊 Total records exported: ${totalRecords}`);
  console.log(`📁 Export saved to: ${exportPath}`);
  console.log(`\n📋 Summary:`);

  for (const [table, data] of Object.entries(exportData)) {
    if (data.length > 0) {
      console.log(`   - ${table}: ${data.length} records`);
    }
  }

  process.exit(0);
}

exportData().catch((error) => {
  console.error("❌ Export failed:", error);
  process.exit(1);
});
