import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/lib/trpc/provider";
import { Toaster }           from "@/components/ui/toaster";
import "@/app/globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-geist-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default:  "EchoVault — Private Collaborative Knowledge Base",
    template: "%s | EchoVault",
  },
  description:
    "A privacy-first collaborative knowledge base with end-to-end encryption. Your notes, your keys, your vault.",
  keywords: ["notes", "encryption", "collaboration", "privacy", "knowledge base"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <TRPCReactProvider>
          {children}
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
