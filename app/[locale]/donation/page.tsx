import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { HeartHandshake, ShieldAlert, Building2, CheckCircle, FileText, Phone, ArrowRight, Utensils, Award } from "lucide-react";
import DonationPortal from "@/components/donation/DonationPortal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "दान व सहयोग - अधिकृत बैंक खाते एवं 80G आयकर छूट | श्री जोरावर धाम"
      : "Donation & Support - Official Bank Accounts & 80G Tax Exemption | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम तीर्थ ट्रस्ट के अन्नक्षेत्र, गौशाला एवं धर्मार्थ प्रकल्पों हेतु अधिकृत बैंक खाते, NEFT/RTGS विवरण एवं दान रसीद प्रक्रिया।"
      : "Official bank transfer details, 80G tax exemption guidelines, and verified donation channels for Shri Jorawar Dham Pilgrimage Trust.",
    alternates: {
      canonical: `/${locale}/donation`,
      languages: {
        hi: "/hi/donation",
        en: "/en/donation",
      },
    },
  };
}

export default async function DonationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <HeartHandshake className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "धर्मार्थ दान एवं सहयोग" : "Charitable Contribution"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम सेवा संकल्प" : "Support Shri Jorawar Dham Trust"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "अन्नक्षेत्र, कामधेनु गौशाला, निःशुल्क चिकित्सा एवं मंदिर विकास हेतु अधिकृत दान सूचना।"
            : "Official donation guidelines for the free community kitchen, cow sanctuary, and pilgrim welfare facilities."}
        </p>
      </div>

      {/* Critical Anti-Fraud Advisory Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-900 font-bold text-lg font-serif">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <span>{isHi ? "अति महत्वपूर्ण सुरक्षा चेतावनी एवं सतर्कता" : "Critical Devotee Security Advisory"}</span>
        </div>
        <p className="text-sm text-red-950 leading-relaxed">
          {isHi
            ? "धाम में सभी श्रद्धालुओं के लिए प्रवेश एवं दर्शन पूर्णतः निःशुल्क हैं। श्री जोरावर धाम ट्रस्ट किसी भी व्यक्ति को व्यक्तिगत खातों अथवा अनधिकृत UPI पर धन स्वीकार करने की अनुमति नहीं देता। कृपया केवल नीचे दिए गए अधिकृत ट्रस्ट बैंक खातों में ही सहयोग राशि प्रेषित करें अथवा मंदिर परिसर स्थित मुख्य कार्यालय दान काउंटर पर अधिकृत पक्की रसीद प्राप्त कर नकद दान दें।"
            : "Sanctum entry and darshan are strictly free for all devotees. Shri Jorawar Dham Trust NEVER authorizes any individual, agent, or intermediary to collect donations via personal UPI IDs or personal accounts. Donations are accepted exclusively via the official Trust bank accounts listed below or at the registered temple office counter where an authorized stamped receipt is provided immediately."}
        </p>
      </div>

      {/* Interactive Online Donation Portal (Razorpay / UPI / NetBanking) */}
      <DonationPortal locale={locale} />

      {/* Trust Bank Accounts Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-maroon-950 font-serif">
            {isHi ? "अधिकृत ट्रस्ट बैंक खाते (NEFT / RTGS / IMPS)" : "Official Trust Bank Accounts (NEFT / RTGS / IMPS)"}
          </h2>
          <span className="text-xs text-stone-500 font-medium bg-sandstone-100 px-3 py-1 rounded-full w-fit">
            {isHi ? "पंजीकृत धर्मार्थ ट्रस्ट" : "Registered Charitable Trust"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Account 1: State Bank of India */}
          <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <Building2 className="w-6 h-6 text-saffron-600" />
              <div>
                <h3 className="font-bold text-lg text-stone-900 font-serif">
                  {isHi ? "भारतीय स्टेट बैंक (SBI)" : "State Bank of India (SBI)"}
                </h3>
                <span className="text-xs text-stone-500">{isHi ? "चूरू मुख्य शाखा, राजस्थान" : "Churu Main Branch, Rajasthan"}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-stone-700 font-mono">
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाता धारक का नाम:" : "Account Beneficiary:"}</span>
                <strong className="text-stone-900 font-sans">SHRI JORAWAR DHAM TEERTH TRUST</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाता संख्या (A/C No):" : "Account Number:"}</span>
                <strong className="text-base text-maroon-900 tracking-wider">39485720194</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "आईएफएससी कोड (IFSC):" : "IFSC Code:"}</span>
                <strong className="text-base text-stone-900">SBIN0001234</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाते का प्रकार:" : "Account Type:"}</span>
                <span className="font-sans text-stone-800">{isHi ? "चालू खाता (Current Account)" : "Current Account"}</span>
              </div>
            </div>
          </div>

          {/* Account 2: Punjab National Bank */}
          <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <Building2 className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-bold text-lg text-stone-900 font-serif">
                  {isHi ? "पंजाब नेशनल बैंक (PNB)" : "Punjab National Bank (PNB)"}
                </h3>
                <span className="text-xs text-stone-500">{isHi ? "चूरू शाखा, राजस्थान" : "Churu Branch, Rajasthan"}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm text-stone-700 font-mono">
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाता धारक का नाम:" : "Account Beneficiary:"}</span>
                <strong className="text-stone-900 font-sans">SHRI JORAWAR DHAM SEVA TRUST</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाता संख्या (A/C No):" : "Account Number:"}</span>
                <strong className="text-base text-maroon-900 tracking-wider">0456002100084729</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "आईएफएससी कोड (IFSC):" : "IFSC Code:"}</span>
                <strong className="text-base text-stone-900">PUNB0045600</strong>
              </div>
              <div>
                <span className="text-xs text-stone-500 block font-sans">{isHi ? "खाते का प्रकार:" : "Account Type:"}</span>
                <span className="font-sans text-stone-800">{isHi ? "चालू खाता (Current Account)" : "Current Account"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 80G Tax Exemption & Receipt Process */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-sandstone-100/80 rounded-2xl p-7 border border-sandstone-300 space-y-4">
          <div className="flex items-center gap-2.5 text-maroon-950 font-bold text-lg font-serif">
            <Award className="w-6 h-6 text-saffron-700" />
            <span>{isHi ? "80G आयकर छूट प्रमाणपत्र" : "Section 80G Income Tax Benefits"}</span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {isHi
              ? "श्री जोरावर धाम तीर्थ ट्रस्ट भारत सरकार के आयकर अधिनियम 1961 की धारा 80G के अंतर्गत पंजीकृत है। दानदाता को प्रदान की जाने वाली अधिकृत रसीद पर 80G छूट का लाभ अनुमन्य है।"
              : "Donations to Shri Jorawar Dham Pilgrimage Trust are eligible for tax deductions under Section 80G of the Indian Income Tax Act 1961. Official 80G certificates are issued upon bank verification."}
          </p>
          <div className="pt-2 text-xs text-stone-600 space-y-1 bg-white p-3 rounded-xl border border-sandstone-200">
            <div><strong>{isHi ? "ट्रस्ट पैन (PAN):" : "Trust PAN:"}</strong> AABTS9284F</div>
            <div><strong>{isHi ? "80G पंजीयन संख्या:" : "80G Registration No:"}</strong> CIT(E)/JAIPUR/80G/2022-23/A/10492</div>
          </div>
        </div>

        <div className="bg-sandstone-100/80 rounded-2xl p-7 border border-sandstone-300 space-y-4">
          <div className="flex items-center gap-2.5 text-maroon-950 font-bold text-lg font-serif">
            <FileText className="w-6 h-6 text-amber-700" />
            <span>{isHi ? "दान रसीद कैसे प्राप्त करें?" : "How to Receive Donation Receipt"}</span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {isHi
              ? "बैंक अंतरण (NEFT / RTGS) करने के पश्चात कृपया अंतरण यूटीआर संख्या (UTR), अपना नाम, पैन नंबर एवं डाक पता trust@jorawardham.org पर ईमेल करें अथवा हमारे कार्यालय व्हाट्सएप नंबर पर प्रेषित करें।"
              : "After completing your bank transfer (NEFT/RTGS), please email the transaction reference (UTR number), full donor name, PAN number, and mailing address to trust@jorawardham.org or Trust helpline."}
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white p-3 rounded-xl border border-sandstone-200">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isHi ? "दान सहायता दूरभाष: +91-98765-43210" : "Donation Assistance Desk: +91-98765-43210"}</span>
          </div>
        </div>
      </div>

      {/* Causes Supported */}
      <div className="bg-white rounded-3xl p-8 border border-sandstone-200 space-y-6">
        <h2 className="text-2xl font-bold text-maroon-950 font-serif">
          {isHi ? "आपके दान का सदुपयोग किन प्रकल्पों में होता है?" : "Charitable Projects Supported by Your Offerings"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-stone-700 text-sm">
          <div className="space-y-2">
            <span className="font-bold text-maroon-900 block font-serif text-base">
              {isHi ? "1. नित्य अन्नक्षेत्र (महाप्रसाद)" : "1. Daily Annakshetra (Free Meals)"}
            </span>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? "प्रतिदिन सैकड़ों जरूरतमंदों, साधु-संतों एवं दूर-दराज से आए श्रद्धालुओं को दोनों समय निःशुल्क भोजन प्रसादी।"
                : "Providing free nutritious sattvic meals daily to hundreds of visiting pilgrims, sadhus, and needy persons."}
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-maroon-900 block font-serif text-base">
              {isHi ? "2. कामधेनु गोशाला संवर्धन" : "2. Kamadhenu Gaushala Care"}
            </span>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? "देसी गोवंश का संरक्षण, हरा चारा, स्वच्छ जल, शेड निर्माण एवं अनुभवी पशु चिकित्सकों द्वारा नियमित स्वास्थ्य रक्षा।"
                : "Nurturing indigenous cattle, clean water facilities, modern sheds, and veterinary medical care."}
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-maroon-900 block font-serif text-base">
              {isHi ? "3. तीर्थयात्री सुविधा एवं चिकित्सा" : "3. Pilgrim Aid & Medical Relief"}
            </span>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? "सुलभ धर्मशाला विश्राम गृह, 24 घंटे प्राथमिक स्वास्थ्य केंद्र एवं स्वच्छ पेयजल प्याऊ व्यवस्था।"
                : "Maintaining clean affordable pilgrim dormitories, 24-hour first aid dispensary, and clean drinking water."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
