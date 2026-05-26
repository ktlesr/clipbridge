import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/pwa-register";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-display",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // Ensure valid locale
  if (!routing.locales.includes(locale as any)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "ClipBridge",
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/icon-192.png",
    },
  };
}

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} ${plusJakartaSans.variable} h-full`} suppressHydrationWarning>
      <body className="h-full antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            <div className="relative min-h-screen overflow-hidden bg-background">
              {/* Organic background mesh gradient blobs matching reference mockup */}
              <div className="absolute top-[5%] left-[-15%] w-[65%] h-[65%] rounded-full bg-[#0ea5e9]/32 blur-[130px] dark:bg-[#0ea5e9]/12 animate-blob-slow" />
              <div className="absolute bottom-[-15%] left-[-5%] w-[55%] h-[55%] rounded-full bg-[#10b981]/25 blur-[130px] dark:bg-[#10b981]/10 animate-blob-slow [animation-delay:5s]" />
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#3b82f6]/26 blur-[140px] dark:bg-[#3b82f6]/10 animate-blob-slow [animation-delay:10s]" />
              <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[#06b6d4]/26 blur-[120px] dark:bg-[#06b6d4]/10 animate-blob-slow [animation-delay:15s]" />
              <div className="absolute top-[20%] right-[15%] w-[50%] h-[50%] rounded-full bg-[#14b8a6]/20 blur-[130px] dark:bg-[#14b8a6]/8 animate-blob-slow [animation-delay:20s]" />

              {/* Grainy Noise Overlay */}
              <div className="noise-overlay" />

              {/* Main content grid */}
              <main className="relative z-10 flex min-h-screen flex-col">
                {children}
              </main>
            </div>
            <Toaster position="top-right" richColors theme="system" closeButton />
            <PWARegister />
            <AnalyticsBeacon />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
