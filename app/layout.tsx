import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const grotesk = Space_Grotesk({
  subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-grotesk", display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const tech = JetBrains_Mono({
  subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tech", display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ISMAIL — Precision, Unleashed.", template: "%s · ISMAIL" },
  description:
    "ISMAIL ONE — a flagship smartphone engineered for precision. Cinematic imaging, Vertex silicon, LumenCore displays. Shop the ISMAIL ecosystem.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "ISMAIL — Precision, Unleashed.",
    description: "Meet the next generation of flagship performance.",
    type: "website",
    images: [{ url: "/renders/hero-obsidian.jpg", width: 1200, height: 1500 }],
    siteName: "ISMAIL",
  },
  icons: { icon: "/icon.svg" },
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${inter.variable} ${tech.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
