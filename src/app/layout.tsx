import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./globals.css";

import { cn } from "@/lib/utils";
import { TRPCReactProvider } from "@/trpc/client";

import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// NEXT_PUBLIC_* is inlined at build time; read directly to avoid importing the
// server-only env module (which validates unrelated secrets) just for metadata.
// NEXT_PUBLIC_APP_URI is required (validated in src/lib/env.ts), hence the `!`.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URI!),
  title: {
    default: "Vibe",
    template: "%s | Vibe",
  },
  description:
    "Create apps and websites by chatting with AI. Vibe builds a live, shareable Next.js app from a single prompt.",
  applicationName: "Vibe",
  keywords: [
    "AI app builder",
    "chat to code",
    "generate website",
    "Next.js",
    "no-code",
  ],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Vibe",
    title: "Vibe",
    description:
      "Create apps and websites by chatting with AI. Vibe builds a live, shareable Next.js app from a single prompt.",
  },
  twitter: {
    card: "summary",
    title: "Vibe",
    description:
      "Create apps and websites by chatting with AI. Vibe builds a live, shareable Next.js app from a single prompt.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C96342",
        },
      }}
    >
      <TRPCReactProvider>
        <html
          lang="en"
          className={cn(
            "h-full",
            "antialiased",
            geistSans.variable,
            geistMono.variable,
            "font-sans",
            inter.variable,
          )}
          suppressHydrationWarning
        >
          <body className="min-h-full flex flex-col">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NuqsAdapter>{children}</NuqsAdapter>
              <Toaster position="top-center" />
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
