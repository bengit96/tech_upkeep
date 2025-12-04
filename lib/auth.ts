import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AdminUser {
  userId: number;
  email: string;
  role: string;
}

/**
 * Verify admin authentication from cookies
 * Returns the admin user if authenticated, null otherwise
 */
export async function verifyAdminAuth(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-token");

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, SECRET_KEY);

    if (payload.role !== "admin") {
      return null;
    }

    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error("Error verifying admin auth:", error);
    return null;
  }
}

/**
 * Require admin authentication - throws error if not authenticated
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await verifyAdminAuth();

  if (!admin) {
    throw new Error("Unauthorized - admin access required");
  }

  return admin;
}
