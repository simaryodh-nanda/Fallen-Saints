import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/components/bag";
import { Header } from "@/components/header";
import { CartDrawer } from "@/components/cart-drawer";
import { Cursor } from "@/components/cursor";
import { AddSheet } from "@/components/add-sheet";
import { SITE } from "@/lib/site";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Beyond Angels — Drop 01", template: "%s | Beyond Angels" },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Beyond Angels — Drop 01",
    description: SITE.description,
    url: "/",
    locale: "en_IN",
    images: [{ url: "/pieces/g-front.png", width: 760, height: 1198, alt: "Bad Influence — black embroidered T-shirt" }],
  },
  twitter: { card: "summary_large_image", title: "Beyond Angels — Drop 01", description: SITE.description, images: ["/pieces/g-front.png"] },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
};

export const viewport: Viewport = { themeColor: "#0f0e0d", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${bodoni.variable}`}>
      <body suppressHydrationWarning className="m-0 overflow-x-clip bg-ink font-sans text-bone antialiased [-webkit-tap-highlight-color:transparent]">
        <BagProvider>
          <Header />
          {children}
          <CartDrawer />
          <AddSheet />
          <Cursor />
        </BagProvider>
      </body>
    </html>
  );
}
