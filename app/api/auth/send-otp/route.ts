import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, otpTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY env var");
}
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.RESEND_FROM || "ben@techupkeep.dev";
const ADMIN_EMAIL = "benlohtechbiz@gmail.com";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Check if email is admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Unauthorized email" },
        { status: 403 }
      );
    }

    // Check if user exists and is admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Create admin user if doesn't exist
      await db.insert(users).values({
        email: email.toLowerCase(),
        role: "admin",
        isActive: true,
      });
    } else if (user.role !== "admin") {
      return NextResponse.json(
        { error: "User is not an admin" },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await db.insert(otpTokens).values({
      email: email.toLowerCase(),
      token: otp,
      expiresAt,
      used: false,
    });

    // Send OTP via email
    try {
      await resend.emails.send({
        from: `Tech Upkeep Admin <${FROM_ADDRESS}>`,
        to: email,
        subject: "Your Tech Upkeep Admin Login Code",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Login Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a202c; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-center; margin-bottom: 20px;">
      <span style="font-size: 30px;">🚀</span>
    </div>
    <h1 style="font-size: 28px; font-weight: 700; margin: 0; color: #1a202c;">Tech Upkeep Admin</h1>
  </div>

  <div style="background: #f7fafc; border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
    <p style="font-size: 16px; color: #4a5568; margin: 0 0 24px 0;">Your verification code is:</p>
    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 0 auto; max-width: 200px;">
      <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea;">${otp}</span>
    </div>
    <p style="font-size: 14px; color: #718096; margin: 24px 0 0 0;">This code expires in 10 minutes</p>
  </div>

  <div style="background: #fff5f5; border-left: 4px solid #fc8181; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #742a2a;">
      <strong>Security Notice:</strong> Never share this code with anyone. Tech Upkeep staff will never ask for your code.
    </p>
  </div>

  <div style="text-align: center; font-size: 14px; color: #718096;">
    <p style="margin: 0 0 8px 0;">If you didn't request this code, please ignore this email.</p>
    <p style="margin: 0;">Tech Upkeep Admin Panel</p>
  </div>
</body>
</html>
        `,
      });

      console.log(`✅ OTP sent to ${email}: ${otp}`); // For development
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "OTP sent successfully",
      // Remove in production:
      debug: process.env.NODE_ENV === "development" ? { otp } : undefined,
    });
  } catch (error) {
    console.error("Error in send-otp:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
