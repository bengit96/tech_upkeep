import { NextResponse, NextRequest } from "next/server";
import fs from 'fs';
import path from 'path';
import { requireAdmin } from "@/lib/auth";

// Simple file-based settings storage
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

interface Settings {
  cronEnabled: boolean;
  scrapeSchedule: string;
  newsletterSchedule: string;
}

const DEFAULT_SETTINGS: Settings = {
  cronEnabled: true,
  scrapeSchedule: "0 6 * * *",  // Daily at 6 AM
  newsletterSchedule: "0 8 * * *"  // Daily at 8 AM
};

function getSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading settings:', error);
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const settings = getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const currentSettings = getSettings();

    const updatedSettings: Settings = {
      ...currentSettings,
      ...body
    };

    saveSettings(updatedSettings);

    return NextResponse.json({
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
