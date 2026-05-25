"use client";

import { motion } from "framer-motion";
import { Laptop, Smartphone, FileText, Clipboard, Image, ShieldCheck } from "lucide-react";
import { ConnectionStatus, FileTransferState } from "@/hooks/useWebRTC";

interface TransferHeroProps {
  connectionStatus: ConnectionStatus;
  fileTransfer: FileTransferState;
}

export function TransferHero({ connectionStatus, fileTransfer }: TransferHeroProps) {
  const isConnected = connectionStatus === "connected";
  const isTransferring = fileTransfer.status === "transferring";
  
  // Calculate file transfer progress percentage
  const progressPercent = fileTransfer.size > 0 
    ? Math.round((fileTransfer.progress / fileTransfer.size) * 100)
    : 0;

  // Animate elements differently based on state
  const packetDuration = isTransferring ? 1.2 : 4; // Faster when transferring
  const packetRepeat = Infinity;

  // Floating packets config when idle
  const idlePackets = [
    { icon: <Clipboard className="h-3.5 w-3.5" />, color: "text-indigo-500", delay: 0, y: -8 },
    { icon: <FileText className="h-3.5 w-3.5" />, color: "text-purple-500", delay: 1.5, y: 8 },
    { icon: <Image className="h-3.5 w-3.5" />, color: "text-pink-500", delay: 2.8, y: -4 },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-500/[0.02] dark:to-purple-500/[0.02] border border-foreground/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-[2px] shadow-sm flex flex-col items-center">
      
      {/* Background glowing waves */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-1/2 bg-indigo-500/5 dark:bg-indigo-500/[0.01] blur-3xl pointer-events-none rounded-full" />

      {/* Main Interactive Grid */}
      <div className="w-full max-w-lg flex items-center justify-between gap-6 relative z-10 py-2">
        
        {/* Device A: Desktop */}
        <div className="relative group flex flex-col items-center gap-2">
          {/* Glowing Aura */}
          <div className="absolute -inset-1.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/5 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
          
          <motion.div 
            animate={isTransferring && fileTransfer.direction === "send" ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="relative flex items-center justify-center w-20 h-20 bg-white/70 dark:bg-zinc-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-md backdrop-blur-md"
          >
            <Laptop className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            
            {/* Active Status Ring */}
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-green-500" />
          </motion.div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desktop</span>
        </div>

        {/* Transfer Bridge (The Tunnel) */}
        <div className="flex-1 flex flex-col justify-center items-center relative h-16 px-2">
          
          {/* Progress Label when transferring */}
          {isTransferring && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-6 flex flex-col items-center gap-0.5 text-center w-full"
            >
              <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/10">
                {fileTransfer.direction === "send" ? "Sending..." : "Receiving..."} {progressPercent}%
              </span>
              <span className="text-[9px] text-muted-foreground truncate max-w-[120px] font-medium">
                {fileTransfer.name}
              </span>
            </motion.div>
          )}

          {/* Dotted Link Path */}
          <div className="w-full relative flex items-center">
            <div className={`w-full border-t-2 border-dashed transition-colors duration-500 ${isTransferring ? "border-indigo-500 dark:border-indigo-400 animate-pulse" : "border-neutral-300 dark:border-neutral-800"}`} />
            
            {/* Central Security Shield */}
            {!isTransferring && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-neutral-200 dark:border-neutral-800 h-6.5 w-6.5 rounded-full flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            )}
          </div>

          {/* Animating Data Packets */}
          <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-hidden">
            {isTransferring ? (
              /* ACTIVE FILE TRANSFER PACKET */
              <motion.div
                initial={{ x: fileTransfer.direction === "send" ? "-10%" : "110%" }}
                animate={{ x: fileTransfer.direction === "send" ? "110%" : "-10%" }}
                transition={{
                  duration: packetDuration,
                  repeat: packetRepeat,
                  ease: "linear",
                }}
                className="absolute top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg border border-indigo-500 flex items-center justify-center"
              >
                <FileText className="h-4 w-4 animate-bounce" />
              </motion.div>
            ) : (
              /* IDLE AUTO FLOATING DUMMY PACKETS (Flowing back and forth) */
              idlePackets.map((packet, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: idx % 2 === 0 ? "-10%" : "110%", y: `calc(-50% + ${packet.y}px)`, opacity: 0 }}
                  animate={{ 
                    x: idx % 2 === 0 ? "110%" : "-10%",
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: packetDuration,
                    delay: packet.delay,
                    repeat: packetRepeat,
                    ease: "easeInOut",
                  }}
                  className={`absolute top-1/2 p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-neutral-200 dark:border-neutral-700 ${packet.color}`}
                >
                  {packet.icon}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Device B: Mobile */}
        <div className="relative group flex flex-col items-center gap-2">
          {/* Glowing Aura */}
          <div className="absolute -inset-1.5 rounded-2xl bg-purple-500/10 dark:bg-purple-500/5 blur-md opacity-75 group-hover:opacity-100 transition duration-500" />
          
          <motion.div 
            animate={isTransferring && fileTransfer.direction === "receive" ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="relative flex items-center justify-center w-20 h-20 bg-white/70 dark:bg-zinc-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-md backdrop-blur-md"
          >
            <Smartphone className="h-9 w-9 text-purple-600 dark:text-purple-400" />
            
            {/* Active Status Ring */}
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
          </motion.div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mobile</span>
        </div>

      </div>

      {/* Progress bar at the very bottom when transferring */}
      {isTransferring && (
        <div className="w-full max-w-sm h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mt-2 border border-neutral-200/50 dark:border-neutral-800/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.1 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_8px_1px_rgba(99,102,241,0.3)]"
          />
        </div>
      )}
    </div>
  );
}
