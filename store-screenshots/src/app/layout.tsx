import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: [
    { path: "../fonts/Pretendard-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Pretendard-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Pretendard-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/Pretendard-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DearMI — Google Play Screenshots",
  description: "Screenshot generator for DearMI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-pretendard), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
