import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { PWARegister } from "@/components/pwa-register";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
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
    <html lang={locale} className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full font-sans antialiased overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            <div className="relative min-h-screen overflow-hidden bg-background">
              {/* Organic background blobs for premium aesthetic */}
              <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/5 animate-blob" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[100px] dark:bg-pink-500/5 animate-blob [animation-delay:2s]" />
              <div className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full bg-purple-500/10 blur-[80px] dark:bg-purple-500/5 animate-blob [animation-delay:4s]" />

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
