import { config } from "dotenv";
config();

import { db } from "../lib/db";
import { sources } from "../lib/db/schema";
import { eq, inArray } from "drizzle-orm";

async function checkSources() {
  const sourceNames = [
    'Pointer',
    'Backend Weekly',
    'Frontend Focus',
    'DevOps Weekly',
    'Quastor',
    'Level Up'
  ];

  console.log("Checking sources...\n");

  const existingSources = await db
    .select()
    .from(sources)
    .where(inArray(sources.name, sourceNames));

  if (existingSources.length > 0) {
    console.log(`✅ Found ${existingSources.length} sources:\n`);
    existingSources.forEach((source) => {
      console.log(`  • ${source.name}`);
      console.log(`    Type: ${source.type}`);
      console.log(`    URL: ${source.url}`);
      console.log(`    Active: ${source.isActive}`);
      console.log(`    Category: ${source.category}`);
      console.log();
    });
  } else {
    console.log("❌ No sources found");
  }

  process.exit(0);
}

checkSources().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
