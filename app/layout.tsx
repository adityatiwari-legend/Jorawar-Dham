import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "श्री जोरावर धाम | Shri Jorawar Dham",
  description: "श्री जोरावर धाम, राजस्थान का पावन तीर्थ स्थल - दर्शन, आरती समय, एवं मंदिर समाचार।",
  icons: {
    icon: "/favicon.ico",
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
