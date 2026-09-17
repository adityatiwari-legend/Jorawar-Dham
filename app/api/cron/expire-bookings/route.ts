import { NextRequest, NextResponse } from "next/server";
import { sweepExpiredBookings } from "@/lib/booking/expiry";
import { getAuthenticatedAdmin } from "@/lib/auth/session";

function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || "jorawar_dham_cron_default_secret_token";
  const authHeader = req.headers.get("authorization");
  const xCronSecret = req.headers.get("x-cron-secret");

  if (xCronSecret && xCronSecret === cronSecret) {
    return true;
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === cronSecret) {
      return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  const isAuthorized = isCronAuthorized(req);
  if (!isAuthorized) {
    let isSuperAdmin = false;
    try {
      const admin = await getAuthenticatedAdmin();
      if (admin?.isSuperAdmin) {
        isSuperAdmin = true;
      }
    } catch {
      isSuperAdmin = false;
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "अनधिकृत: क्रॉन सीक्रेट अथवा सुपर एडमिन अनुमति अनिवार्य है (Unauthorized)" },
        { status: 401 }
      );
    }
  }

  const result = await sweepExpiredBookings();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: NextRequest) {
  const isAuthorized = isCronAuthorized(req);
  if (!isAuthorized) {
    let isSuperAdmin = false;
    try {
      const admin = await getAuthenticatedAdmin();
      if (admin?.isSuperAdmin) {
        isSuperAdmin = true;
      }
    } catch {
      isSuperAdmin = false;
    }

    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "अनधिकृत: क्रॉन सीक्रेट अथवा सुपर एडमिन अनुमति अनिवार्य है (Unauthorized)" },
        { status: 401 }
      );
    }
  }

  const result = await sweepExpiredBookings();
  return NextResponse.json({ success: true, ...result });
}
