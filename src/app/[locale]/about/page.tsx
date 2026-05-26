"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Cpu, RefreshCw, Layers, Info, Sparkles, Image, Zap, Plus, Minus } from "lucide-react";

export default function AboutPage() {
  const t = useTranslations("about");
  const tHome = useTranslations("home");
  const router = useRouter();

  // Animation variants for staggered list
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 md:px-12 md:py-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex justify-between items-center w-full z-20 mb-10">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/")}
          className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("backHome")}</span>
        </motion.button>

        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 relative transition-transform duration-300">
            <div className="absolute inset-0.5 rounded-[14px] bg-background/25 backdrop-blur-sm" />
            <span className="relative text-primary-foreground font-black text-xl tracking-wider">K</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 font-display hidden sm:block">
            ClipBridge
          </span>
        </motion.div>

        <LanguageThemeToggle />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-10 z-10 py-4 max-w-5xl mx-auto w-full">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90 }}
          className="text-center flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-bold border border-primary/10 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-display tracking-wide uppercase text-[10px]">Why ClipBridge?</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight font-display bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/75">
            {t("title")}
          </h1>
          <p className="text-base md:text-lg font-bold text-primary/80 max-w-xl font-display">
            {t("subtitle")}
          </p>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl mt-2 font-medium">
            {t("description")}
          </p>
        </motion.div>

        {/* 6-Card Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
        >
          {/* Card 1: P2P */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <Shield className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.p2pTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.p2pDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 2: Lossless Quality */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <Image className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.losslessTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.losslessDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 3: IndexedDB History */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <Cpu className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.indexedDbTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.indexedDbDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 4: Export/Import */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <RefreshCw className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.exportTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.exportDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 5: PWA / Background */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <Layers className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.pwaTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.pwaDesc")}
              </p>
            </div>
          </motion.div>

          {/* Card 6: Zero Sign-up */}
          <motion.div
            variants={itemVariants}
            className="glass rounded-[28px] p-6 border border-foreground/5 hover:border-primary/15 hover:shadow-lg transition-all group flex flex-col gap-4 shadow-sm"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary group-hover:scale-105 transition-all shadow-sm">
              <Zap className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground mb-2 font-display">
                {t("features.signupTitle")}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                {t("features.signupDesc")}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Premium Comparison Section */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 w-full mt-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">
              {t("comparison.title")}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold">
              {t("comparison.subtitle")}
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-foreground/10 bg-background/30 backdrop-blur-sm shadow-sm">
            <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/5 text-foreground/80 font-bold font-display">
                  <th className="py-5 px-6">{t("comparison.feature")}</th>
                  <th className="py-5 px-6 text-primary font-black bg-primary/5 border-x border-primary/10">
                    <span className="flex items-center gap-1.5 justify-center">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      {t("comparison.clipbridge")}
                    </span>
                  </th>
                  <th className="py-5 px-6 text-center">{t("comparison.cloudApps")}</th>
                  <th className="py-5 px-6 text-center">{t("comparison.airdrop")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5 text-muted-foreground font-medium">
                {/* Row 1: Privacy */}
                <tr className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="py-5 px-6 font-bold text-foreground">{t("comparison.privacy")}</td>
                  <td className="py-5 px-6 bg-primary/5 border-x border-primary/10 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.privacyVal")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.privacyValAlt")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.privacyValAirdrop")}
                    </span>
                  </td>
                </tr>

                {/* Row 2: Quality */}
                <tr className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="py-5 px-6 font-bold text-foreground">{t("comparison.quality")}</td>
                  <td className="py-5 px-6 bg-primary/5 border-x border-primary/10 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.qualityVal")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.qualityValAlt")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.qualityValAirdrop")}
                    </span>
                  </td>
                </tr>

                {/* Row 3: Platforms */}
                <tr className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="py-5 px-6 font-bold text-foreground">{t("comparison.platforms")}</td>
                  <td className="py-5 px-6 bg-primary/5 border-x border-primary/10 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.platformsVal")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.platformsValAlt")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.platformsValAirdrop")}
                    </span>
                  </td>
                </tr>

                {/* Row 4: Limits */}
                <tr className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="py-5 px-6 font-bold text-foreground">{t("comparison.fileSize")}</td>
                  <td className="py-5 px-6 bg-primary/5 border-x border-primary/10 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.fileSizeVal")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.fileSizeValAlt")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.fileSizeValAirdrop")}
                    </span>
                  </td>
                </tr>

                {/* Row 5: Account/Setup */}
                <tr className="hover:bg-foreground/[0.01] transition-colors">
                  <td className="py-5 px-6 font-bold text-foreground">{t("comparison.setup")}</td>
                  <td className="py-5 px-6 bg-primary/5 border-x border-primary/10 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/15 px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                      <Plus className="h-3 w-3 shrink-0" />
                      {t("comparison.setupVal")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.setupValAlt")}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 bg-foreground/5 text-muted-foreground px-3 py-1 rounded-xl text-xs">
                      <Minus className="h-3 w-3 shrink-0" />
                      {t("comparison.setupValAirdrop")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Footer Info Banner */}
      <footer className="w-full flex justify-center mt-16 z-20">
        <div className="glass rounded-2xl px-5 py-3.5 flex items-center gap-2 max-w-xl text-[11px] md:text-xs text-muted-foreground font-semibold border border-primary/10 shadow-sm">
          <Info className="h-4.5 w-4.5 text-primary shrink-0 animate-pulse" />
          <span>ClipBridge P2P technology utilizes direct browser channels. Clipboard content and files are not stored server-side.</span>
        </div>
      </footer>
    </div>
  );
}
