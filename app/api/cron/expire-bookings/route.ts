import { NextResponse } from "next/server";
import { sweepExpiredBookings } from "@/lib/booking/expiry";

export async function GET() {
  const result = await sweepExpiredBookings();
  return NextResponse.json({ success: true, ...result });
}

export async function POST() {
  const result = await sweepExpiredBookings();
  return NextResponse.json({ success: true, ...result });
}
