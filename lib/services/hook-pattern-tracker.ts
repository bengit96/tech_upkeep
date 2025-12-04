/**
 * Simple file-based tracker for hook pattern rotation
 * Persists the last used pattern ID to maintain variety across sessions
 */

import fs from "fs";
import path from "path";

const TRACKER_FILE = path.join(process.cwd(), "data", "hook-pattern.json");

interface TrackerData {
  lastPatternId: string;
  lastUsedAt: string;
  usageHistory: Array<{ patternId: string; usedAt: string }>;
}

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load tracker data from file
 */
export function loadTrackerData(): TrackerData | null {
  try {
    ensureDataDir();
    if (fs.existsSync(TRACKER_FILE)) {
      const data = fs.readFileSync(TRACKER_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading hook pattern tracker:", error);
  }
  return null;
}

/**
 * Save tracker data to file
 */
export function saveTrackerData(patternId: string): void {
  try {
    ensureDataDir();

    const existing = loadTrackerData();
    const now = new Date().toISOString();

    const data: TrackerData = {
      lastPatternId: patternId,
      lastUsedAt: now,
      usageHistory: [
        ...(existing?.usageHistory || []).slice(-19), // Keep last 20
        { patternId, usedAt: now },
      ],
    };

    fs.writeFileSync(TRACKER_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving hook pattern tracker:", error);
  }
}

/**
 * Get the last used pattern ID
 */
export function getLastUsedPatternId(): string | undefined {
  const data = loadTrackerData();
  return data?.lastPatternId;
}

/**
 * Get usage statistics
 */
export function getUsageStats(): Record<string, number> {
  const data = loadTrackerData();
  if (!data?.usageHistory) return {};

  return data.usageHistory.reduce((acc, entry) => {
    acc[entry.patternId] = (acc[entry.patternId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
