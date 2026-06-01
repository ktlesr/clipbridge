"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileTransferState, ConnectionStatus } from "@/hooks/useWebRTC";
import { UploadCloud, File, FileCheck, FileX, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface FilePanelProps {
  connectionStatus: ConnectionStatus;
  fileTransfer: FileTransferState;
  sendFile: (file: File) => void;
}

export function FilePanel({ connectionStatus, fileTransfer, sendFile }: FilePanelProps) {
  const t = useTranslations("files");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const isConnected = connectionStatus === "connected";

  const processFile = (file: File) => {
    if (file.size > 250 * 1024 * 1024) {
      toast.error(t("exceedLimit"));
      return;
    }
    sendFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (!isConnected) {
      toast.error("Please wait for peer connection to establish.");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isConnected) {
      toast.error("Please wait for peer connection to establish.");
      return;
    }
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const progressPercent = fileTransfer.size > 0 
    ? Math.round((fileTransfer.progress / fileTransfer.size) * 100) 
    : 0;

  return (
    <div className="glass rounded-[32px] p-6 flex flex-col h-full gap-5 border border-foreground/5 shadow-xl relative overflow-hidden">
      <h2 className="text-xl font-bold flex items-center gap-2 font-display text-foreground">
        <UploadCloud className="h-5 w-5 text-primary" />
        {t("title")}
      </h2>

      <AnimatePresence mode="wait">
        {/* Drag & Drop Area */}
        {fileTransfer.status === "idle" && (
          <motion.div
            key="idle-dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
              isDragActive 
                ? "border-primary bg-primary/8 shadow-lg shadow-primary/5" 
                : "border-foreground/10 hover:border-primary/40 hover:bg-foreground/5"
            } ${!isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={!isConnected}
              className="hidden"
            />
            <UploadCloud className="h-12 w-12 text-primary/60 animate-bounce" style={{ animationDuration: "2s" }} />
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-foreground text-sm font-display">{t("dragDrop")}</span>
              <span className="text-xs text-muted-foreground font-semibold">{t("limitTip")}</span>
            </div>
          </motion.div>
        )}

        {/* Transferring Progress State */}
        {fileTransfer.status === "transferring" && (
          <motion.div
            key="transferring-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-4.5 p-5 rounded-2xl bg-foreground/5 border border-foreground/5 shadow-inner"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/10 shadow-sm shrink-0">
                <File className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate text-foreground leading-none">{fileTransfer.name}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-bold tracking-wide">{formatBytes(fileTransfer.size)}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/15 flex items-center gap-1 uppercase tracking-wider">
                  {fileTransfer.direction === "send" ? (
                    <>
                      <ArrowUpRight className="h-3 w-3" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="h-3 w-3" />
                      {t("receiving")}
                    </>
                  )}
                </span>
                <span className="text-xs font-black text-foreground font-display">{progressPercent}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-foreground/15 rounded-full h-2 overflow-hidden border border-foreground/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.1 }}
                className="bg-gradient-to-r from-primary to-primary/60 h-2 rounded-full shadow-sm shadow-primary/20"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              <span>{formatBytes(fileTransfer.progress)} / {formatBytes(fileTransfer.size)}</span>
              {fileTransfer.direction === "receive" && (
                <span className="text-blue-500 animate-pulse font-black text-[9px] tracking-wide">{t("bgNotice")}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Completed State */}
        {fileTransfer.status === "completed" && (
          <motion.div
            key="completed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-4.5 p-5 rounded-2xl bg-green-500/5 border border-green-500/15 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/10 shadow-sm shrink-0">
                <FileCheck className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate text-foreground leading-none">{fileTransfer.name}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-bold tracking-wide">{formatBytes(fileTransfer.size)}</p>
              </div>
              <div className="shrink-0">
                <span className="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-display">
                  {t("completed")}
                </span>
              </div>
            </div>

            {/* Re-download button if they received the file */}
            {fileTransfer.direction === "receive" && fileTransfer.blobUrl && (
              <a
                href={fileTransfer.blobUrl}
                download={fileTransfer.name.replace(/[\/\\]/g, "")}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-green-500 cursor-pointer shadow-md shadow-green-650/15 font-display"
              >
                <Download className="h-4 w-4" />
                {t("download")}
              </a>
            )}

            <button
              onClick={() => {
                // Reset status back to idle
                fileTransfer.status = "idle";
                // Trigger state refresh
                window.location.reload();
              }}
              className="text-[10px] text-center text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest underline mt-1 transition-colors"
            >
              Send another file
            </button>
          </motion.div>
        )}

        {/* Failed State */}
        {fileTransfer.status === "failed" && (
          <motion.div
            key="failed-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-4.5 p-5 rounded-2xl bg-red-500/5 border border-red-500/15 shadow-sm"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/10 shadow-sm shrink-0">
                <FileX className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate text-foreground leading-none">{fileTransfer.name}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-bold tracking-wide">{formatBytes(fileTransfer.size)}</p>
              </div>
              <div className="shrink-0">
                <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-display">
                  {t("failed")}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                // Trigger reload or reset
                window.location.reload();
              }}
              className="text-[10px] text-center text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest underline mt-1 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
