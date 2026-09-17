import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "सिद्ध श्री जोरावर धाम | Siddh Shri Jorawar Dham",
  description: "सिद्ध श्री जोरावर धाम सेवा समिति, राजस्थान - दर्शन, आरती समय, सेवा एवं मंदिर समाचार।",
  icons: {
    icon: [
      { url: "/branding/jorawar-dham-icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/branding/jorawar-dham-icon.png", type: "image/png" },
    ],
    shortcut: "/branding/jorawar-dham-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-sandstone-50 text-stone-900 antialiased selection:bg-saffron-200 selection:text-saffron-900">
        {children}
      </body>
    </html>
  );
}
