import "./globals.css";
import type { Metadata } from "next";

import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import Script from "next/script";
import QueryProvider from "@/providers/query-provider";
import SiteEffects from "@/providers/site-effects";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import AnnouncementBar from "@/components/announcement-bar";
import MaintenanceGate from "@/components/maintenance-gate";

const APP_NAME = "AniBlossom";
const APP_DEFAULT_TITLE = "AniBlossom — Watch Anime Free";
const APP_DESCRIPTION = "Stream your favourite anime beautifully, with no ads";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  manifest: "/manifest.json",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/aniblossom-logo.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/aniblossom-logo.svg" />
        {/* GitHub Pages SPA routing: restore path from redirect */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(l) {
            if (l.search[1] === '/') {
              var decoded = l.search.slice(1).split('&').map(function(s) {
                return s.replace(/~and~/g, '&')
              }).join('?');
              window.history.replaceState(null, null,
                l.pathname.slice(0, -1) + decoded + l.hash
              );
            }
          }(window.location))
        `}} />
      </head>
      <body
        className="antialiased max-w-[100vw] overflow-x-hidden min-h-screen bg-[#0d0d12] text-[#f0eef5]"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <QueryProvider>
            <SiteEffects />
            <MaintenanceGate>
              <AnnouncementBar />
              <NavBar />
              <main>{children}</main>
              <Footer />
            </MaintenanceGate>
          </QueryProvider>
        </ThemeProvider>
        <Toaster
          toastOptions={{
            style: {
              background: "rgba(18,18,25,0.98)",
              border: "1px solid rgba(232,109,176,0.25)",
              color: "#f0eef5",
              backdropFilter: "blur(20px)",
            },
          }}
        />
        {/* Monetag/Propeller in-page push ad tag — renders its own closable
            corner notification, no service worker registration involved. */}
        <Script
          src="https://5gvci.com/act/files/tag.min.js?z=11653721"
          data-cfasync="false"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
