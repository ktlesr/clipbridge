"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useWebRTC } from "@/hooks/useWebRTC";
import { ClipboardPanel } from "@/components/clipboard-panel";
import { FilePanel } from "@/components/file-panel";
import { InfoBar } from "@/components/info-bar";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowLeft, LogOut, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();

  const t = useTranslations("room");
  const router = useRouter();

  const [copiedLink, setCopiedLink] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");

  const handlePeerDisconnect = () => {
    toast.error("Peer disconnected. Returning to waiting state.");
  };

  const {
    connectionStatus,
    clipboardHistory,
    fileTransfer,
    sendText,
    sendFile,
  } = useWebRTC(code, handlePeerDisconnect);

  // Get current room URL on mount
  useEffect(() => {
    setRoomUrl(window.location.href);
  }, []);

  // Exit warning beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (connectionStatus === "connected" || fileTransfer.status === "transferring") {
        e.preventDefault();
        e.returnValue = t("exitWarning");
        return t("exitWarning");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [connectionStatus, fileTransfer.status, t]);

  const copyRoomLink = () => {
    if (!roomUrl) return;
    navigator.clipboard.writeText(roomUrl)
      .then(() => {
        setCopiedLink(true);
        toast.success(t("linkCopied"));
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link.");
      });
  };

  const handleLeave = () => {
    if (
      connectionStatus !== "connected" ||
      confirm(t("exitWarning"))
    ) {
      router.push("/");
    }
  };

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full z-20 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLeave}
          className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Anasayfa</span>
        </motion.button>

        <h1 className="hidden sm:block text-md font-bold tracking-tight bg-foreground/10 px-4 py-1.5 rounded-full border border-foreground/5">
          Room: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{code}</span>
        </h1>

        <div className="flex items-center gap-3">
          <LanguageThemeToggle />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLeave}
            className="flex items-center justify-center p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer border border-red-500/10"
          >
            <LogOut className="h-4.5 w-4.5" />
          </motion.button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col justify-center items-center w-full z-10 py-4">
        {isConnected ? (
          /* Connected Dual-Panel layout */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-6"
          >
            <InfoBar />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
              <ClipboardPanel
                connectionStatus={connectionStatus}
                history={clipboardHistory}
                sendText={sendText}
              />
              <FilePanel
                connectionStatus={connectionStatus}
                fileTransfer={fileTransfer}
                sendFile={sendFile}
              />
            </div>
          </motion.div>
        ) : (
          /* Waiting for Peer or Connecting Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-6 md:p-10 w-full max-w-xl text-center shadow-2xl relative border-foreground/10 flex flex-col items-center gap-6"
          >
            {isConnecting ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="font-semibold text-foreground/80">{t("status.connecting")}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {t("peerWaiting")}
                  </h2>
                  <div className="text-4xl font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 mt-2 select-all bg-indigo-500/5 px-6 py-2.5 rounded-2xl border border-indigo-500/10">
                    {code}
                  </div>
                </div>

                {/* QR Code Container */}
                {roomUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-4.5 rounded-2xl shadow-inner border border-neutral-200/80 relative"
                  >
                    <QRCodeSVG
                      value={roomUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                    {/* Embedded badge logo in QR Center */}
                    <div className="absolute top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] bg-indigo-600 border border-white h-7.5 w-7.5 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white font-extrabold text-xs">K</span>
                    </div>
                  </motion.div>
                )}

                {/* Link and Share */}
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  <div className="flex items-center gap-2 bg-foreground/5 p-2 rounded-2xl border border-foreground/5 relative overflow-hidden">
                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
                    <span className="text-xs truncate font-medium flex-1 text-left text-muted-foreground select-all pr-4">
                      {roomUrl}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={copyRoomLink}
                      className="glass text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-foreground/5 cursor-pointer shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground animate-pulse mt-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span>Waiting for another device to scan or enter code...</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer Status Display */}
      <footer className="w-full flex justify-between items-center z-20 mt-6 text-xs text-muted-foreground font-semibold">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : isConnecting ? "bg-amber-500" : "bg-red-500"}`} />
          <span>
            {isConnected 
              ? t("status.connected") 
              : isConnecting 
                ? t("status.connecting") 
                : t("status.disconnected")}
          </span>
        </div>
        <div>
          <span>ClipBridge P2P</span>
        </div>
      </footer>
    </div>
  );
}
