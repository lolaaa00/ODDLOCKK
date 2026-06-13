import type { Metadata } from "next";
import { Staatliches, Changa_One, Nunito_Sans, Azeret_Mono, Exo_2 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const staatliches = Staatliches({
  variable: "--font-staatliches",
  subsets: ["latin"],
  weight: "400",
});
const changaOne = Changa_One({
  variable: "--font-changa-one",
  subsets: ["latin"],
  weight: "400",
});
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});
const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const exo2 = Exo_2({
  variable: "--font-exo-2",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OddLock: Sealed Wager Settlement",
  description:
    "OddLock is a GenLayer-native P2P outcome settlement protocol. Studionet only. Not real-money gambling.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${staatliches.variable} ${changaOne.variable} ${nunitoSans.variable} ${azeretMono.variable} ${exo2.variable} h-full`}
    >
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
