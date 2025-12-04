/**
 * Import data from JSON export into PostgreSQL database
 * Run with: DATABASE_URL=postgresql://... npx tsx scripts/import-db.ts <export-file.json>
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error(
    "Usage: DATABASE_URL=postgresql://user:pass@host:port/db npx tsx scripts/import-db.ts <export-file.json>"
  );
  process.exit(1);
}

if (
  !databaseUrl.startsWith("postgres://") &&
  !databaseUrl.startsWith("postgresql://")
) {
  console.error("❌ DATABASE_URL must be a PostgreSQL connection string");
  process.exit(1);
}

// Get export file from command line argument
const exportFile = process.argv[2];
if (!exportFile) {
  console.error("❌ Please specify the export file");
  console.error(
    "Usage: DATABASE_URL=postgresql://... npx tsx scripts/import-db.ts <export-file.json>"
  );
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(exportFile)) {
  console.error(`❌ Export file not found: ${exportFile}`);
  process.exit(1);
}

// Create PostgreSQL client
const sql = postgres(databaseUrl);

// Tables to import (in dependency order)
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
  // Skip otp_tokens as they're temporary and may be expired
];

async function importData() {
  console.log("📥 Starting database import...\n");
  console.log(`📁 Reading from: ${exportFile}\n`);

  // Read export file
  const exportData = JSON.parse(fs.readFileSync(exportFile, "utf-8"));

  let totalRecords = 0;
  const errors: string[] = [];

  // Import each table
  for (const table of tables) {
    const data = exportData[table] || [];

    if (data.length === 0) {
      console.log(`⏭️  Skipping ${table} (no data)`);
      continue;
    }

    console.log(`📄 Importing ${table} (${data.length} records)...`);

    try {
      // Get column names from first record
      const firstRecord = data[0];
      const columns = Object.keys(firstRecord);

      let imported = 0;
      let skipped = 0;

      // Import records one by one to handle conflicts
      for (const record of data) {
        try {
          // Build INSERT query
          const values = columns.map((col) => record[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
          const columnsList = columns.join(", ");

          // Use ON CONFLICT DO NOTHING for tables with unique constraints
          const query = `
            INSERT INTO ${table} (${columnsList})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;

          await sql.unsafe(query, values);
          imported++;
        } catch (error: any) {
          skipped++;
          if (skipped <= 3) {
            // Only log first 3 errors per table
            console.log(`   ⚠️  Skipped record in ${table}: ${error.message}`);
          }
        }
      }

      console.log(`   ✅ Imported ${imported} records (skipped ${skipped})`);
      totalRecords += imported;

      // Reset sequence for id columns
      try {
        await sql.unsafe(`
          SELECT setval(
            pg_get_serial_sequence('${table}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${table}), 1),
            true
          )
        `);
      } catch (error) {
        // Ignore errors for tables without id column
      }
    } catch (error: any) {
      console.error(`   ❌ Error importing ${table}:`, error.message);
      errors.push(`${table}: ${error.message}`);
    }
  }

  await sql.end();

  console.log(`\n✅ Import complete!`);
  console.log(`📊 Total records imported: ${totalRecords}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

importData().catch((error) => {
  console.error("❌ Import failed:", error);
  process.exit(1);
});
