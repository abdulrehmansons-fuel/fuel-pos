import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Petrol POS System",
  description: "Modern petrol pump point of sale system",
  icons: {
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTRiOGE2JyBzdHJva2Utd2lkdGg9JzInIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCc+PHBhdGggZD0nTTQgM2gxMHYxOEg0eicvPjxwYXRoIGQ9J00xNCA3aDJhMiAyIDAgMCAxIDIgMnY3Jy8+PHBhdGggZD0nTTkgMTdoNicvPjwvc3ZnPg==",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyNCAyNCcgZmlsbD0nbm9uZScgc3Ryb2tlPScjMTRiOGE2JyBzdHJva2Utd2lkdGg9JzInIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCc+PHBhdGggZD0nTTQgM2gxMHYxOEg0eicvPjxwYXRoIGQ9J00xNCA3aDJhMiAyIDAgMCAxIDIgMnY3Jy8+PHBhdGggZD0nTTkgMTdoNicvPjwvc3ZnPg==" />
      </head>
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
