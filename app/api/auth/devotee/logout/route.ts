import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEVOTEE_SESSION_COOKIE, invalidateDevoteeSession } from "@/lib/auth/devotee";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEVOTEE_SESSION_COOKIE)?.value;

    if (token) {
      await invalidateDevoteeSession(token);
    }

    const res = NextResponse.json({ success: true, message: "सफलतापूर्वक लॉगआउट किया गया" });
    res.cookies.set({
      name: DEVOTEE_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch {
    return NextResponse.json({ success: false, error: "लॉगआउट विफल" }, { status: 500 });
  }
}
