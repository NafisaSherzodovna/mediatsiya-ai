import type { Metadata, Viewport } from "next";
import { Onest, Source_Serif_4, Unbounded } from "next/font/google";
import { PageBackdrop } from "@/components/brand/page-backdrop";
import { YangiBridge } from "@/components/brand/yangi-bridge";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND } from "@/lib/brand";
import { toYangi } from "@/lib/yangi";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext"],
});

const literata = Source_Serif_4({
  variable: "--font-literata",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: toYangi(`${BRAND.name} — nizoni sudsiz hal qilish`),
  description: toYangi(BRAND.tagline),
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${unbounded.variable} ${onest.variable} ${literata.variable} h-full antialiased`}>
      <body className="bg-paper relative isolate flex min-h-full flex-col">
        <PageBackdrop />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" />
        <YangiBridge />
      </body>
    </html>
  );
}
