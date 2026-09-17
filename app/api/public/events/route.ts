import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: { in: ["UPCOMING", "ONGOING"] },
      },
      orderBy: { startDate: "asc" },
      take: 20,
    });

    return NextResponse.json(
      { success: true, data: events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
