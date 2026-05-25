"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { motion } from "framer-motion";

export function InfoBar() {
  const t = useTranslations("room");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex items-start gap-3 rounded-2xl p-4 text-sm text-foreground/80 border-amber-500/20 bg-amber-500/5 dark:border-amber-500/10"
    >
      <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium leading-relaxed">{t("warningBar")}</p>
      </div>
    </motion.div>
  );
}
