import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { getAuthenticatedAdmin } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // If accessed directly from a browser, redirect to the formatted digital receipt page
    const acceptHeader = req.headers.get("accept") || "";
    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(new URL(`/hi/donation/receipt/${id}`, req.url), 307);
    }

    const donation = await prisma.donation.findUnique({
      where: { id },
      include: { cause: true },
    });

    if (!donation) {
      return NextResponse.json({ success: false, error: "दान रसीद उपलब्ध नहीं है" }, { status: 404 });
    }

    if (donation.status !== "PAID") {
      return NextResponse.json({ success: false, error: "दान भुगतान अभी लंबित या असफल है" }, { status: 400 });
    }

    // Devotee session or Admin session check for IDOR protection
    const devotee = await getAuthenticatedDevotee();
    const admin = await getAuthenticatedAdmin();

    // If donation was made by a logged-in devotee, only that devotee or admin can view details
    if (donation.userId && (!devotee || devotee.id !== donation.userId) && !admin) {
      return NextResponse.json({ success: false, error: "अनधिकृत पहुंच (Unauthorized access)" }, { status: 403 });
    }

    const maskedPhone =
      donation.donorPhone.length >= 6
        ? `${donation.donorPhone.slice(0, 2)}****${donation.donorPhone.slice(-4)}`
        : "****";

    return NextResponse.json({
      success: true,
      receipt: {
        receiptNumber: donation.receiptNumber,
        donationReference: donation.donationReference,
        organizationNameHi: "सिद्ध श्री जोरावर धाम सेवा समिति",
        organizationNameEn: "Siddh Shri Jorawar Dham Seva Samiti",
        trustRegistrationNo: "COOP/2023/DHOLPUR/201054",
        legalNoteHi: "यह रसीद सिद्ध श्री जोरावर धाम सेवा समिति के धार्मिक व धर्मार्थ प्रकल्पों हेतु स्वीकार किए गए दान का प्रमाण है।",
        legalNoteEn: "This is an official receipt for charitable contribution made towards religious and social projects of Siddh Shri Jorawar Dham Seva Samiti.",
        causeTitleHi: donation.cause?.titleHi || "सामान्य धर्मार्थ सेवा",
        causeTitleEn: donation.cause?.titleEn || "General Sacred Welfare",
        donorName: donation.donorName,
        maskedPhone,
        donorPan: donation.donorPan ? `******${donation.donorPan.slice(-4)}` : null,
        amountInRupees: Math.round(donation.amountInPaise / 100),
        currency: "INR",
        issuedAt: donation.receiptIssuedAt || donation.paidAt || donation.createdAt,
        gatewayPaymentId: donation.gatewayPaymentId,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "रसीद प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
