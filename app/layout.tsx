import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "OddLock: Sealed Wager Settlement",
  description:
    "OddLock is a GenLayer-native P2P outcome settlement protocol. Studionet only. Not real-money gambling.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body
        className="min-h-full flex flex-col font-nunito antialiased"
        style={{ background: "#1A0A08", color: "#DDD0CC" }}
      >
        {/* CSS-only gradient mesh, fixed, no JS */}
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
