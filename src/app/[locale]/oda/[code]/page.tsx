"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useWebRTC } from "@/hooks/useWebRTC";
import { ClipboardPanel } from "@/components/clipboard-panel";
import { FilePanel } from "@/components/file-panel";
import { InfoBar } from "@/components/info-bar";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ArrowLeft, LogOut, Loader2, Link2, AlertTriangle, HelpCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TransferHero } from "@/components/transfer-hero";

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const routeParams = useParams();
  const code = (routeParams?.code as string || "").toUpperCase();

  const t = useTranslations("room");
  const tHome = useTranslations("home");
  const router = useRouter();

  const [copiedLink, setCopiedLink] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<"/" | "/about">("/");
  const [lastRoom, setLastRoom] = useState<string | null>(null);

  const handlePeerDisconnect = () => {
    toast.error("Peer disconnected. Returning to waiting state.");
  };

  const {
    connectionStatus,
    clipboardHistory,
    fileTransfer,
    signalingError,
    sendText,
    sendFile,
    importHistory,
    clearHistory,
  } = useWebRTC(code, handlePeerDisconnect);

  // Get current room URL on mount
  useEffect(() => {
    setRoomUrl(window.location.href);
  }, []);

  // Save last room code to localStorage for quick rejoin
  useEffect(() => {
    if (code) {
      setLastRoom(localStorage.getItem("lastRoomCode") || code);
      localStorage.setItem("lastRoomCode", code);
    }
  }, [code]);

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

  const handleNavigateAway = (route: "/" | "/about") => {
    if (connectionStatus !== "connected" && fileTransfer.status !== "transferring") {
      router.push(route);
    } else {
      setPendingRoute(route);
      setShowExitConfirm(true);
    }
  };

  const handleLeave = () => handleNavigateAway("/");

  const handleRejoinRecentRoom = () => {
    if (!lastRoom) return;

    if (lastRoom.toUpperCase() === code) {
      window.location.reload();
      return;
    }

    router.push(`/oda/${lastRoom}`);
  };

  const confirmLeave = () => {
    setShowExitConfirm(false);
    router.push(pendingRoute);
  };

  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 md:px-12 md:py-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <header className="flex items-center justify-center gap-2 sm:justify-between sm:gap-3 w-full z-20 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLeave}
          className="glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground cursor-pointer sm:gap-2 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anasayfa</span>
        </motion.button>

        <h1 className="hidden sm:block text-md font-bold tracking-tight bg-foreground/10 px-4 py-1.5 rounded-full border border-foreground/5">
          Room: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{code}</span>
        </h1>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigateAway("/about")}
            className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
          >
            <HelpCircle className="h-4 w-4 text-indigo-500" />
            <span className="hidden sm:inline">{tHome("aboutLink")}</span>
          </motion.button>
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
      <div className={`flex-1 flex flex-col ${isConnected ? "justify-start" : "justify-center"} items-center w-full z-10 py-4`}>
        {signalingError ? (
          /* Signaling Error Screen (Room Not Found / Room Full) */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 w-full max-w-md text-center shadow-2xl relative border-red-500/20 flex flex-col items-center gap-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-md">
              <AlertTriangle className="h-8 w-8 text-red-500 animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {signalingError === "room-not-found" ? t("errorTitleNotFound") : t("errorTitleFull")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {signalingError === "room-not-found" ? t("errorDescNotFound") : t("errorDescFull")}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/")}
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-4 font-semibold text-white transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 cursor-pointer"
            >
              {t("backToHome")}
            </motion.button>
          </motion.div>
        ) : isConnected ? (
          /* Connected Dual-Panel layout */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-6"
          >
            <TransferHero
              connectionStatus={connectionStatus}
              fileTransfer={fileTransfer}
            />
            <InfoBar />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
              <ClipboardPanel
                roomCode={code}
                connectionStatus={connectionStatus}
                history={clipboardHistory}
                sendText={sendText}
                importHistory={importHistory}
                clearHistory={clearHistory}
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
                  {lastRoom && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleRejoinRecentRoom}
                      className="flex items-center justify-between gap-3 w-full rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span>{tHome("recentRoom")}</span>
                      </span>
                      <span className="bg-indigo-600 text-white font-extrabold px-2.5 py-1 rounded-xl text-xs tracking-wider shadow-sm shadow-indigo-600/20">
                        {lastRoom}
                      </span>
                    </motion.button>
                  )}
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
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
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
                  {t("exitConfirmTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("exitWarning")}
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 rounded-2xl bg-foreground/10 hover:bg-foreground/15 py-3 text-sm font-semibold text-foreground transition-all cursor-pointer"
                >
                  {t("cancel")}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmLeave}
                  className="flex-1 rounded-2xl bg-red-600 hover:bg-red-500 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-red-600/25 cursor-pointer"
                >
                  {t("confirmLeave")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
