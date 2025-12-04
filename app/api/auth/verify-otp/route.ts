import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, otpTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Find valid OTP token
    const now = new Date();
    const [tokenRecord] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.email, email.toLowerCase()),
          eq(otpTokens.token, otp),
          eq(otpTokens.used, false),
          gt(otpTokens.expiresAt, now)
        )
      )
      .orderBy(otpTokens.createdAt)
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Mark token as used
    await db
      .update(otpTokens)
      .set({ used: true })
      .where(eq(otpTokens.id, tokenRecord.id));

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "User is not an admin" },
        { status: 403 }
      );
    }

    // Generate JWT token (expires in 7 days)
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(SECRET_KEY);

    // Create response with cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
