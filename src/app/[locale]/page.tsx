"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LanguageThemeToggle } from "@/components/language-theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ArrowRight, Compass, PlusCircle, Laptop, ShieldCheck, QrCode, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { QRScanner } from "@/components/qr-scanner";

export default function HomePage() {
  const t = useTranslations("home");
  const tPwa = useTranslations("pwa");
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [loadingType, setLoadingType] = useState<"create" | "join" | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [lastRoom, setLastRoom] = useState<string | null>(null);

  // Load last connected room code on mount (client-side only)
  useEffect(() => {
    const code = localStorage.getItem("lastRoomCode");
    if (code) {
      setLastRoom(code);
    }
  }, []);

  // Capture PWA installation trigger
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  const handleCreateRoom = () => {
    setLoadingType("create");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${window.location.hostname}:3001`;
    const wsUrl = `${protocol}//${wsHost}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "create-room" }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "room-created") {
          toast.success("Room created successfully!");
          ws.close(); // Close the creation-only socket to free the room slots
          router.push(`/oda/${data.code}`);
        } else if (data.type === "error") {
          toast.error(`Error creating room: ${data.message}`);
          setLoadingType(null);
        }
      } catch (err) {
        console.error("Error creating room:", err);
        setLoadingType(null);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      toast.error("Failed to connect to signaling server.");
      setLoadingType(null);
    };

    ws.onclose = () => {
      // If we haven't redirected yet, reset loading
      setTimeout(() => setLoadingType(null), 2000);
    };
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanCode || cleanCode.length !== 5) {
      toast.error(t("invalidCode"));
      return;
    }

    setLoadingType("join");
    router.push(`/oda/${cleanCode}`);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-6 py-6 md:px-12 md:py-10 max-w-7xl mx-auto w-full">
      {/* Top Header Navigation */}
      <header className="flex justify-between items-center w-full z-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 relative transition-transform duration-300">
            <div className="absolute inset-0.5 rounded-[14px] bg-background/20 backdrop-blur-sm" />
            <span className="relative text-white font-black text-xl tracking-wider">K</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 font-display">
            ClipBridge
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/about")}
            className="glass flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-sm"
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">{t("aboutLink")}</span>
          </motion.button>
          <LanguageThemeToggle />
        </motion.div>
      </header>

      {/* Main Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 md:py-20 z-10 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 90 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight font-display bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/75">
            {t("welcome")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
            {t("tagline")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 90 }}
          className="glass rounded-[32px] p-6 md:p-8 w-full shadow-2xl relative border-foreground/5 glow-card-indigo"
        >
          {/* Quick Rejoin Recent Room */}
          {lastRoom && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setLoadingType("join");
                router.push(`/oda/${lastRoom}`);
              }}
              disabled={loadingType !== null}
              className="mb-6 flex items-center justify-between gap-3 w-full rounded-2xl bg-primary/8 hover:bg-primary/12 border border-primary/15 px-4.5 py-3.5 text-xs font-bold text-primary cursor-pointer transition-all disabled:opacity-50 shadow-sm"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span>{t("recentRoom")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-primary text-white font-extrabold px-3 py-1 rounded-xl text-xs tracking-wider shadow-md shadow-primary/20">
                  {lastRoom}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </motion.button>
          )}

          {/* Create Room Section */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRoom}
            disabled={loadingType !== null}
            className="flex items-center justify-center gap-3 w-full rounded-2xl bg-primary px-4 py-4 font-bold text-white transition-all hover:bg-primary/95 shadow-lg shadow-primary/25 hover:shadow-primary/35 cursor-pointer disabled:opacity-50 font-display"
          >
            {loadingType === "create" ? (
              <span className="flex items-center gap-2">
                <span className="h-4.5 w-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {t("creating")}
              </span>
            ) : (
              <>
                <PlusCircle className="h-5 w-5" />
                {t("createRoom")}
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-foreground/10" />
            </div>
            <span className="relative px-3.5 text-xs text-muted-foreground uppercase font-black tracking-widest bg-[#f9f9fb] dark:bg-[#05050a] rounded-full">
              {t("or")}
            </span>
          </div>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom} className="flex flex-col gap-3.5">
            <div className="relative flex items-center">
              <Compass className="absolute left-4.5 h-5 w-5 text-muted-foreground opacity-60" />
              <input
                type="text"
                maxLength={5}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder={t("joinRoomPlaceholder")}
                disabled={loadingType !== null}
                className="w-full rounded-2xl border border-foreground/10 bg-background/30 hover:border-foreground/15 pl-12 pr-12 py-4 text-sm font-bold tracking-widest text-center uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:normal-case placeholder:tracking-normal text-foreground"
              />
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                disabled={loadingType !== null}
                className="absolute right-3 p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Scan QR Code"
              >
                <QrCode className="h-5 w-5" />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: roomCode.trim().length === 5 ? 1.02 : 1 }}
              whileTap={{ scale: roomCode.trim().length === 5 ? 0.98 : 1 }}
              type="submit"
              disabled={loadingType !== null || roomCode.trim().length !== 5}
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 px-4 py-4 font-bold text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-display shadow-sm"
            >
              {loadingType === "join" ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                  {t("joining")}
                </span>
              ) : (
                <>
                  {t("joinButton")}
                  <ArrowRight className="h-4 w-4 animate-pulse" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Footer & PWA Prompt */}
      <footer className="w-full z-20 flex flex-col items-center gap-6 mt-12">
        <AnimatePresence>
          {deferredPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass rounded-[24px] p-5 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-lg w-full border-primary/20 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-purple-600" />
              <div className="flex items-start gap-3">
                <Laptop className="h-5.5 w-5.5 text-primary shrink-0 mt-0.5" />
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-foreground">{tPwa("installPrompt")}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">{tPwa("installDesc")}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallApp}
                className="rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4.5 py-2.5 cursor-pointer shadow-md shadow-primary/20 font-display shrink-0"
              >
                {tPwa("installPrompt")}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold"
        >
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>{t("securityBadge")}</span>
        </motion.div>
      </footer>

      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsQRScannerOpen(false);
          setRoomCode(code);
          toast.success("QR Code scanned! Joining room...");
          router.push(`/oda/${code}`);
        }}
      />
    </div>
  );
}
