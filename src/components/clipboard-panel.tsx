"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ClipboardItem, ConnectionStatus } from "@/hooks/useWebRTC";
import { Send, Copy, Check, History, Sparkles, Upload, Download, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ClipboardPanelProps {
  roomCode: string;
  connectionStatus: ConnectionStatus;
  history: ClipboardItem[];
  sendText: (text: string) => void;
  importHistory: (importedItems: ClipboardItem[]) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export function ClipboardPanel({
  roomCode,
  connectionStatus,
  history,
  sendText,
  importHistory,
  clearHistory,
}: ClipboardPanelProps) {
  const t = useTranslations("clipboard");
  const [text, setText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    if (history.length === 0) {
      toast.error(t("emptyExport") || "No history to export.");
      return;
    }
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `clipbridge_history_${roomCode}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success(t("exportSuccess") || "History exported successfully!");
    } catch (err) {
      toast.error("Failed to export history.");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          throw new Error("Invalid format");
        }

        const validItems = imported.filter(item => 
          item && 
          typeof item.id === "string" && 
          typeof item.text === "string" && 
          typeof item.timestamp === "number" && 
          typeof item.isSent === "boolean"
        );

        if (validItems.length === 0) {
          toast.error(t("importInvalid") || "No valid history items found.");
          return;
        }

        await importHistory(validItems);
      } catch (err) {
        console.error("Failed to parse import file:", err);
        toast.error(t("importFailed") || "Failed to parse history file.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = async () => {
    setShowClearConfirm(false);
    await clearHistory();
    toast.success(t("clearSuccess"));
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <History className="h-4.5 w-4.5" />
            {t("history")}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            {/* Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected}
              className="p-1.5 rounded-xl bg-foreground/5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-foreground/5"
              title={t("importBtn")}
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={history.length === 0}
              className="p-1.5 rounded-xl bg-foreground/5 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-foreground/5"
              title={t("exportBtn")}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            {/* Clear Button */}
            <button
              onClick={handleClear}
              disabled={history.length === 0}
              className="p-1.5 rounded-xl bg-foreground/5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-foreground/5"
              title={t("clearBtn")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
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
      
      {/* Custom Confirmation Modal for Clearing History */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 dark:bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl border border-foreground/10 bg-background/95 p-6 text-center shadow-2xl flex flex-col items-center gap-5"
            >
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-md">
                <AlertTriangle className="h-7 w-7 text-amber-500 animate-pulse" />
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-bold text-lg text-foreground">
                  {t("clearConfirmTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("clearConfirm")}
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-2xl bg-foreground/10 hover:bg-foreground/15 py-3 text-sm font-semibold text-foreground transition-all cursor-pointer"
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmClear}
                  className="flex-1 rounded-2xl bg-red-600 hover:bg-red-500 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-red-600/25 cursor-pointer"
                >
                  {t("clearBtn")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
