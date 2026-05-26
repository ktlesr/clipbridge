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
              {/* Organic background blobs for premium aesthetic */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[120px] dark:bg-indigo-500/5 animate-blob-slow" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px] dark:bg-pink-500/5 animate-blob-slow [animation-delay:3s]" />
              <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-500/5 animate-blob-slow [animation-delay:6s]" />

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
