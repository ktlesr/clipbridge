"use client";

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Languages, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageThemeToggle() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("pwa"); // metadata context or any translation namespace

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: "tr" | "en") => {
    localStorage.setItem("locale", newLocale);
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  const getThemeIcon = (currentTheme?: string) => {
    if (!mounted) {
      return <Laptop className="h-4 w-4 text-slate-400" />;
    }
    switch (currentTheme) {
      case "light":
        return <Sun className="h-4 w-4 text-orange-500" />;
      case "dark":
        return <Moon className="h-4 w-4 text-violet-400" />;
      default:
        return <Laptop className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
      >
        <Languages className="h-4 w-4 opacity-70" />
        <span className="uppercase">{locale}</span>
        <span className="mx-1 h-3 w-px bg-foreground/20" />
        {getThemeIcon(theme)}
        <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="glass absolute right-0 mt-2 w-56 origin-top-right rounded-2xl p-2 shadow-xl focus:outline-none z-50 overflow-hidden"
          >
            {/* Language Selection */}
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dil / Language
            </div>
            <button
              onClick={() => switchLocale("tr")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <span>Türkçe</span>
              {locale === "tr" && <Check className="h-4 w-4 text-indigo-500" />}
            </button>
            <button
              onClick={() => switchLocale("en")}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <span>English</span>
              {locale === "en" && <Check className="h-4 w-4 text-indigo-500" />}
            </button>

            <div className="my-1.5 h-px bg-foreground/10" />

            {/* Theme Selection */}
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tema / Theme
            </div>
            <button
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-orange-500" />
                <span>Light</span>
              </div>
              {mounted && theme === "light" && <Check className="h-4 w-4 text-indigo-500" />}
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-violet-400" />
                <span>Dark</span>
              </div>
              {mounted && theme === "dark" && <Check className="h-4 w-4 text-indigo-500" />}
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-slate-400" />
                <span>System</span>
              </div>
              {mounted && theme === "system" && <Check className="h-4 w-4 text-indigo-500" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
