import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "말씀타자 — 성경으로 채우는 타자 습관";
const description = "성경 66권 타자연습과 25단계 말씀 전투를 즐기고, 선수 아이디로 점수와 실시간 랭킹을 기록하는 웹게임";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host = (incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "127.0.0.1:3000")
    .split(",")[0]
    .trim();
  const protocol = (incomingHeaders.get("x-forwarded-proto") ?? (host.includes("127.0.0.1") || host.includes("localhost") ? "http" : "https"))
    .split(",")[0]
    .trim();
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og-ranking.png", metadataBase).toString();

  return {
    metadataBase,
    title,
    description,
    applicationName: "말씀타자",
    appleWebApp: {
      capable: true,
      title: "말씀타자",
      statusBarStyle: "black-translucent",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "ko_KR",
      images: [{ url: socialImage, width: 1734, height: 907, alt: "말씀타자 타자연습·말씀 전투·실시간 랭킹" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
