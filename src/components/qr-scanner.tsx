"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export function QRScanner({ isOpen, onClose, onScanSuccess }: QRScannerProps) {
  const [scanError, setScanError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setScanError(null);
    setIsLoading(true);
    
    let activeStream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let isComponentMounted = true;

    const startCamera = async () => {
      try {
        // 1. Load jsQR from CDN if not already available
        if (!(window as any).jsQR) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load QR engine. Check connection."));
            document.body.appendChild(script);
          });
        }

        if (!isComponentMounted) return;

        // 2. Request back camera facing mode
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        activeStream = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true"); // Prevent iOS native full screen
          
          videoRef.current.onloadedmetadata = () => {
            if (isComponentMounted) {
              setIsLoading(false);
              videoRef.current?.play().catch(e => console.error("Error playing video:", e));
              // Start scanning frame loop
              tick();
            }
          };
        }
      } catch (err: any) {
        console.error("[QR Scanner] Camera error:", err);
        setIsLoading(false);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setScanError("Camera access denied. Please grant permission in browser settings.");
        } else {
          setScanError("Camera access error: " + (err.message || err.name));
        }
      }
    };

    const tick = () => {
      if (!isComponentMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          
          // Draw video frame onto hidden canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Grab pixels
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const jsQR = (window as any).jsQR;
          
          if (jsQR) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });
            
            if (code && code.data) {
              let scannedData = code.data.trim();
              
              // Try to extract 5-digit code from room URLs: e.g. /oda/B9CYL
              const urlMatch = scannedData.match(/\/oda\/([A-Z2-9]{5})/i);
              if (urlMatch && urlMatch[1]) {
                scannedData = urlMatch[1];
              }

              // Validate final 5-digit room code format
              if (/^[A-Z2-9]{5}$/i.test(scannedData)) {
                onScanSuccess(scannedData.toUpperCase());
                return; // Stop scanning loop
              }
            }
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      isComponentMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, onScanSuccess]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="relative bg-zinc-900 border border-neutral-800 rounded-3xl overflow-hidden w-full max-w-md shadow-2xl p-6 flex flex-col items-center gap-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center w-full border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-white">Scan Room QR Code</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Viewfinder / Camera Viewport */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-neutral-800 flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-900 z-10">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-xs text-neutral-400 font-semibold">Starting camera...</p>
                </div>
              )}

              {scanError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 z-10 p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                  <p className="text-sm font-semibold text-neutral-200">{scanError}</p>
                  <button
                    onClick={onClose}
                    className="mt-2 text-xs font-semibold px-4 py-2 bg-neutral-800 text-white rounded-xl hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {/* Live video */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                  />
                  
                  {/* Hidden Canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay scanning viewfinder grid */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-2/3 h-2/3 border-2 border-dashed border-indigo-500/50 rounded-2xl">
                      {/* Viewfinder Corners */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-md" />

                      {/* Scanning laser animation */}
                      <div className="absolute left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_8px_2px_rgba(99,102,241,0.5)] animate-scan-line" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Instruction */}
            <div className="text-center">
              <p className="text-sm text-neutral-300 font-medium">
                Position the QR code inside the viewfinder frame.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                It will scan automatically once detected.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
