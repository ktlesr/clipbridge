"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { FileTransferState, ConnectionStatus } from "@/hooks/useWebRTC";
import { UploadCloud, File, FileCheck, FileX, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion } from "framer-motion";
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
    if (file.size > 50 * 1024 * 1024) {
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
    <div className="glass rounded-3xl p-6 flex flex-col h-full gap-5">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <UploadCloud className="h-5 w-5 text-indigo-500" />
        {t("title")}
      </h2>

      {/* Drag & Drop Area */}
      {fileTransfer.status === "idle" && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
            isDragActive 
              ? "border-indigo-500 bg-indigo-500/5" 
              : "border-foreground/10 hover:border-indigo-500/40 hover:bg-foreground/5"
          } ${!isConnected ? "opacity-55 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={!isConnected}
            className="hidden"
          />
          <UploadCloud className="h-12 w-12 text-indigo-500/60 animate-pulse" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground text-sm">{t("dragDrop")}</span>
            <span className="text-xs text-muted-foreground">{t("limitTip")}</span>
          </div>
        </div>
      )}

      {/* Transferring Progress State */}
      {fileTransfer.status === "transferring" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <File className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate text-foreground">{fileTransfer.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(fileTransfer.size)}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
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
              <span className="text-xs font-bold text-foreground">{progressPercent}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-foreground/10 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.1 }}
              className="bg-indigo-600 h-2.5 rounded-full"
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
            <span>{formatBytes(fileTransfer.progress)} / {formatBytes(fileTransfer.size)}</span>
            {fileTransfer.direction === "receive" && (
              <span className="text-pink-500 animate-pulse">{t("bgNotice")}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Completed State */}
      {fileTransfer.status === "completed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4 p-4 rounded-2xl bg-green-500/5 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <FileCheck className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate text-foreground">{fileTransfer.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(fileTransfer.size)}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {t("completed")}
              </span>
            </div>
          </div>

          {/* Re-download button if they received the file */}
          {fileTransfer.direction === "receive" && fileTransfer.blobUrl && (
            <a
              href={fileTransfer.blobUrl}
              download={fileTransfer.name.replace(/[\/\\]/g, "")}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-green-500 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              {t("download")}
            </a>
          )}

          <button
            onClick={() => {
              // Reset status back to idle
              fileTransfer.status = "idle";
              // Trigger state refresh by setting fileTransfer to default idle
              window.location.reload(); // Simple refresh or let hook reset
            }}
            className="text-[10px] text-center text-muted-foreground hover:text-foreground font-semibold underline mt-1"
          >
            Send another file
          </button>
        </motion.div>
      )}

      {/* Failed State */}
      {fileTransfer.status === "failed" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <FileX className="h-6 w-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-sm truncate text-foreground">{fileTransfer.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(fileTransfer.size)}</p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                {t("failed")}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              // Trigger reload or reset
              window.location.reload();
            }}
            className="text-[10px] text-center text-muted-foreground hover:text-foreground font-semibold underline mt-1"
          >
            Try Again
          </button>
        </motion.div>
      )}
    </div>
  );
}
