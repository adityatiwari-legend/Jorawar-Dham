import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth/guard";
import { errorResponse } from "@/lib/utils/errors";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAuth(req);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.adminId,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        roles: admin.roles,
        permissions: admin.permissions,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error) {
    return errorResponse(error, "admin_me");
  }
}
