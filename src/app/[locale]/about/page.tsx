"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Cpu, RefreshCw, Layers, CheckCircle2, XCircle, Info, Sparkles } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("about");
  const router = useRouter();

  // Animation variants for staggered list
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 md:px-12 md:py-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex justify-between items-center w-full z-20 mb-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/")}
          className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("backHome")}</span>
        </motion.button>

        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-lg tracking-wider">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 hidden sm:block">
            ClipBridge
          </span>
        </div>

        <LanguageThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-16 z-10 py-4 max-w-4xl mx-auto w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Why ClipBridge?</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/75 leading-tight">
            {t("title")}
          </h1>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 max-w-xl">
            {t("subtitle")}
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mt-2">
            {t("description")}
          </p>
        </motion.div>

        {/* Highlighted P2P Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
        >
          {/* Card 1: 100% P2P */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-3xl p-6 border border-foreground/5 hover:border-indigo-500/20 transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("features.p2pTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("features.p2pDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 2: IndexedDB History */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-3xl p-6 border border-foreground/5 hover:border-indigo-500/20 transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/10 group-hover:scale-105 transition-transform">
              <Cpu className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("features.indexedDbTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("features.indexedDbDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 3: Export/Import */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-3xl p-6 border border-foreground/5 hover:border-indigo-500/20 transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/10 group-hover:scale-105 transition-transform">
              <RefreshCw className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("features.exportTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("features.exportDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 4: PWA / Background */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-3xl p-6 border border-foreground/5 hover:border-indigo-500/20 transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 group-hover:scale-105 transition-transform">
              <Layers className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("features.pwaTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("features.pwaDesc")}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Comparison Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6 w-full"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {t("comparison.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("comparison.subtitle")}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-foreground/10 bg-background/50 shadow-inner">
            <table className="w-full text-left border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/5 font-semibold text-foreground">
                  <th className="p-4.5">{t("comparison.feature")}</th>
                  <th className="p-4.5 text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    {t("comparison.clipbridge")}
                  </th>
                  <th className="p-4.5 text-muted-foreground">{t("comparison.cloudApps")}</th>
                  <th className="p-4.5 text-muted-foreground">{t("comparison.airdrop")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5 text-muted-foreground font-medium">
                {/* Row 1: Privacy */}
                <tr>
                  <td className="p-4.5 font-bold text-foreground">{t("comparison.privacy")}</td>
                  <td className="p-4.5 text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t("comparison.privacyVal")}</span>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.privacyValAlt")}</span>
                    </div>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>{t("comparison.privacyValAirdrop")}</span>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Platforms */}
                <tr>
                  <td className="p-4.5 font-bold text-foreground">{t("comparison.platforms")}</td>
                  <td className="p-4.5 text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">{t("comparison.platformsVal")}</span>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.platformsValAlt")}</span>
                    </div>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.platformsValAirdrop")}</span>
                    </div>
                  </td>
                </tr>

                {/* Row 3: Limits */}
                <tr>
                  <td className="p-4.5 font-bold text-foreground">{t("comparison.fileSize")}</td>
                  <td className="p-4.5 text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">{t("comparison.fileSizeVal")}</span>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.fileSizeValAlt")}</span>
                    </div>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                      <span>{t("comparison.fileSizeValAirdrop")}</span>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Account/Setup */}
                <tr>
                  <td className="p-4.5 font-bold text-foreground">{t("comparison.setup")}</td>
                  <td className="p-4.5 text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t("comparison.setupVal")}</span>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.setupValAlt")}</span>
                    </div>
                  </td>
                  <td className="p-4.5">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                      <span>{t("comparison.setupValAirdrop")}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Footer Info Banner */}
      <footer className="w-full flex justify-center mt-12 z-20">
        <div className="glass rounded-2xl px-5 py-3 flex items-center gap-2 max-w-xl text-[11px] md:text-xs text-muted-foreground font-semibold border border-foreground/5 shadow-sm">
          <Info className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
          <span>ClipBridge P2P technology utilizes direct browser channels. No logs, no data retention, 100% private.</span>
        </div>
      </footer>
    </div>
  );
}
