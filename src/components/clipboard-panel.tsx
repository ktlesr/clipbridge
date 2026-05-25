"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardItem, ConnectionStatus } from "@/hooks/useWebRTC";
import { Send, Copy, Check, History, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ClipboardPanelProps {
  connectionStatus: ConnectionStatus;
  history: ClipboardItem[];
  sendText: (text: string) => void;
}

export function ClipboardPanel({ connectionStatus, history, sendText }: ClipboardPanelProps) {
  const t = useTranslations("clipboard");
  const [text, setText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    sendText(text.trim());
    setText("");
  };

  const handleCopy = (id: string, payload: string) => {
    navigator.clipboard.writeText(payload)
      .then(() => {
        setCopiedId(id);
        toast.success(t("copied"));
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard.");
      });
  };

  const isConnected = connectionStatus === "connected";

  return (
    <div className="glass rounded-3xl p-6 flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          {t("title")}
        </h2>
        
        {/* Connection status indicator in header */}
        <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      </div>

      {/* Text Area input */}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("placeholder")}
          rows={4}
          disabled={!isConnected}
          className="w-full rounded-2xl border border-foreground/10 bg-background/50 p-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all resize-none"
        />
        <motion.button
          whileHover={{ scale: isConnected && text.trim() ? 1.01 : 1 }}
          whileTap={{ scale: isConnected && text.trim() ? 0.99 : 1 }}
          onClick={handleSend}
          disabled={!isConnected || !text.trim()}
          className="flex items-center justify-center gap-2 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {t("send")}
        </motion.button>
      </div>

      {/* Clipboard History List */}
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <History className="h-4.5 w-4.5" />
          {t("history")}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[300px]">
          <AnimatePresence initial={false}>
            {history.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground py-8"
              >
                {t("empty")}
              </motion.div>
            ) : (
              history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col gap-2 p-3.5 rounded-2xl border text-sm relative group bg-background/40 ${item.isSent ? "border-indigo-500/10" : "border-pink-500/10"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="whitespace-pre-wrap break-all text-foreground leading-relaxed flex-1 select-text">
                      {item.text}
                    </p>
                    <button
                      onClick={() => handleCopy(item.id, item.text)}
                      className="glass p-2 rounded-xl text-muted-foreground hover:text-foreground transition-all hover:scale-105 shrink-0"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium mt-1">
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-2 py-0.5 rounded-full ${item.isSent ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-pink-500/10 text-pink-600 dark:text-pink-400"}`}>
                      {item.isSent ? "Sent" : "Received"}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
