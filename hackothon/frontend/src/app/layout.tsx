import type { Metadata } from "next";
import "./globals.css";
import { AuthWrapper } from "@/lib/auth-wrapper";

export const metadata: Metadata = {
  title: "ICCIP — Integrated Chronic Care Intelligence Platform",
  description: "AI-powered chronic disease risk prediction and care management platform. Predict heart disease, kidney disease, stroke, diabetes, brain tumor, and thyroid disorders using trained ML models.",
  keywords: "chronic care, AI health, disease prediction, healthcare, ML models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="animated-bg" />
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
