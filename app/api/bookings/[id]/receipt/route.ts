import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedDevotee } from "@/lib/auth/devotee";
import { prisma } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const devotee = await getAuthenticatedDevotee();
    if (!devotee) {
      return NextResponse.json({ success: false, error: "लॉगिन आवश्यक है" }, { status: 401 });
    }

    const { id } = await params;

    const receipt = await prisma.receipt.findFirst({
      where: { bookingId: id },
      include: {
        booking: {
          include: {
            service: true,
            slot: true,
          },
        },
        payment: true,
      },
    });

    if (!receipt) {
      return NextResponse.json({ success: false, error: "रसीद उपलब्ध नहीं है (Receipt not found)" }, { status: 404 });
    }

    // IDOR Protection: only booking owner can fetch receipt
    if (receipt.booking.userId !== devotee.id) {
      return NextResponse.json({ success: false, error: "अनधिकृत अनुरोध" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      receipt: {
        receiptNumber: receipt.receiptNumber,
        bookingReference: receipt.booking.bookingReference,
        devoteeName: receipt.devoteeName,
        maskedPhone: receipt.maskedPhone,
        serviceTitleHi: receipt.serviceTitleHi,
        serviceTitleEn: receipt.serviceTitleEn,
        slotTime: `${receipt.booking.slot.startTime} - ${receipt.booking.slot.endTime}`,
        bookingDate: receipt.booking.bookingDate.toISOString().split("T")[0],
        numberOfDevotees: receipt.booking.numberOfDevotees,
        amountInPaise: receipt.amountInPaise,
        paymentReference: receipt.payment.paymentReference,
        gatewayPaymentId: receipt.payment.gatewayPaymentId || "DIRECT_TRUST_SYSTEM",
        issuedAt: receipt.issuedAt,
        organization: {
          nameHi: "सिद्ध श्री जोरावर धाम सेवा समिति",
          nameEn: "Siddh Shri Jorawar Dham Seva Samiti",
          registrationNo: "COOP/2023/DHOLPUR/201054",
          address: "सिद्ध श्री जोरावर धाम, धौलपुर / राजस्थान",
          pan: "AABTS9284F",
          taxExemption80G: null, // Note: Darshan/Pooja Seva fees are not 80G tax deductible (applicable only to pure donations)
          receiptType: "SEVA_FEE",
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "रसीद प्राप्त करने में त्रुटि" }, { status: 500 });
  }
}
