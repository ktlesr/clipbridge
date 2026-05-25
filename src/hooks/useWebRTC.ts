import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
  isSent: boolean;
}

export interface FileTransferState {
  name: string;
  size: number;
  progress: number;
  direction: "send" | "receive" | null;
  status: "idle" | "transferring" | "completed" | "failed";
  blobUrl?: string;
}

const CHUNK_SIZE = 16384; // 16 KB standard WebRTC chunk size
const BUFFERED_AMOUNT_LOW_THRESHOLD = 65536; // 64 KB

export function useWebRTC(roomCode: string | null, onPeerDisconnected?: () => void) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([]);
  const [fileTransfer, setFileTransfer] = useState<FileTransferState>({
    name: "",
    size: 0,
    progress: 0,
    direction: null,
    status: "idle",
  });
  const [peerId, setPeerId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const currentFileMetaRef = useRef<{ name: string; size: number; mime: string } | null>(null);

  // Clean up WebRTC peer connection
  const cleanupPeerConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setConnectionStatus("disconnected");
  }, []);

  // Send clipboard text to peer
  const sendText = useCallback((text: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      const item: ClipboardItem = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        timestamp: Date.now(),
        isSent: true,
      };

      dataChannelRef.current.send(JSON.stringify({
        type: "clipboard",
        payload: text,
      }));

      setClipboardHistory(prev => [item, ...prev]);
      toast.success("Text sent to peer!");
    } else {
      toast.error("No active connection. Cannot send text.");
    }
  }, []);

  // Send file to peer
  const sendFile = useCallback(async (file: File) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      toast.error("No active connection. Cannot send file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50 MB limit.");
      return;
    }

    setFileTransfer({
      name: file.name,
      size: file.size,
      progress: 0,
      direction: "send",
      status: "transferring",
    });

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        const channel = dataChannelRef.current;
        if (!channel) return;

        // Send metadata first
        channel.send(JSON.stringify({
          type: "file-meta",
          name: file.name,
          size: file.size,
          mime: file.type || "application/octet-stream",
        }));

        let offset = 0;

        const sendNextChunk = async (): Promise<void> => {
          while (offset < buffer.byteLength) {
            // Check data channel state
            if (channel.readyState !== "open") {
              setFileTransfer(prev => ({ ...prev, status: "failed" }));
              toast.error("Connection lost during file transfer.");
              return;
            }

            // Flow control: wait if buffer is too full
            if (channel.bufferedAmount > BUFFERED_AMOUNT_LOW_THRESHOLD * 8) {
              await new Promise<void>((resolve) => {
                const onBufferedAmountLow = () => {
                  channel.removeEventListener("bufferedamountlow", onBufferedAmountLow);
                  resolve();
                };
                channel.addEventListener("bufferedamountlow", onBufferedAmountLow);
              });
            }

            const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
            channel.send(chunk);
            offset += chunk.byteLength;

            setFileTransfer(prev => ({
              ...prev,
              progress: Math.min(offset, file.size),
            }));
          }

          // Send termination packet
          channel.send(JSON.stringify({ type: "file-end" }));
          
          setFileTransfer(prev => ({ ...prev, status: "completed" }));
          toast.success("File sent successfully!");

          // Notify service worker of transfer completion
          if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: "TRANSFER_STATUS",
              status: "completed",
              fileName: file.name,
            });
          }
        };

        // Notify service worker of transfer start
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "TRANSFER_STATUS",
            status: "started",
            fileName: file.name,
          });
        }

        await sendNextChunk();
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Error preparing file transmission:", error);
      setFileTransfer(prev => ({ ...prev, status: "failed" }));
      toast.error("Failed to read file.");
    }
  }, []);

  // Initialize WebRTC Peer Connection
  const initPeerConnection = useCallback((ws: WebSocket, isOffer: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = pc;
    setConnectionStatus("connecting");

    // Send local candidates to the peer via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "signal",
          data: { candidate: event.candidate },
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state changed: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        setConnectionStatus("connected");
      } else if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanupPeerConnection();
      }
    };

    const setupDataChannelEvents = (channel: RTCDataChannel) => {
      dataChannelRef.current = channel;
      channel.binaryType = "arraybuffer";
      channel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;

      channel.onopen = () => {
        console.log("[WebRTC] Data Channel Opened");
        setConnectionStatus("connected");
      };

      channel.onclose = () => {
        console.log("[WebRTC] Data Channel Closed");
        cleanupPeerConnection();
      };

      channel.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "clipboard") {
              const item: ClipboardItem = {
                id: Math.random().toString(36).substring(2, 9),
                text: msg.payload,
                timestamp: Date.now(),
                isSent: false,
              };
              setClipboardHistory(prev => [item, ...prev]);
              toast.info("New text received from peer!");

              // Try auto-copying if enabled and tab focused
              if (localStorage.getItem("autoSyncEnabled") === "true") {
                navigator.clipboard.writeText(msg.payload)
                  .then(() => toast.success("Auto-copied to clipboard!"))
                  .catch(() => console.warn("Failed to auto-copy. Clipboard API requires focus."));
              }
            } else if (msg.type === "file-meta") {
              // File transfer header
              currentFileMetaRef.current = {
                name: msg.name,
                size: msg.size,
                mime: msg.mime,
              };
              receivedChunksRef.current = [];
              setFileTransfer({
                name: msg.name,
                size: msg.size,
                progress: 0,
                direction: "receive",
                status: "transferring",
              });
              console.log(`[WebRTC] Receiving file: ${msg.name} (${msg.size} bytes)`);
            } else if (msg.type === "file-end") {
              // Finish file rebuild
              const meta = currentFileMetaRef.current;
              if (meta) {
                const blob = new Blob(receivedChunksRef.current, { type: meta.mime });
                const blobUrl = URL.createObjectURL(blob);

                setFileTransfer(prev => ({
                  ...prev,
                  status: "completed",
                  blobUrl,
                }));

                // Auto-trigger browser download
                const link = document.createElement("a");
                // SECURE: sanitize filename against path traversals
                const cleanName = meta.name.replace(/[\/\\]/g, "");
                link.href = blobUrl;
                link.download = cleanName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`Received & downloaded: ${cleanName}`);
                currentFileMetaRef.current = null;
                receivedChunksRef.current = [];
              }
            }
          } catch (e) {
            console.error("Error processing text data channel message:", e);
          }
        } else if (event.data instanceof ArrayBuffer) {
          // Push binary chunks
          receivedChunksRef.current.push(event.data);
          setFileTransfer(prev => {
            const newProgress = prev.progress + event.data.byteLength;
            return {
              ...prev,
              progress: Math.min(newProgress, prev.size),
            };
          });
        }
      };
    };

    if (isOffer) {
      const channel = pc.createDataChannel("bridge-data-channel", {
        ordered: true,
      });
      setupDataChannelEvents(channel);

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "signal",
              data: { sdp: pc.localDescription },
            }));
          }
        })
        .catch((err) => console.error("Error creating local RTC offer:", err));
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannelEvents(event.channel);
      };
    }

    return pc;
  }, [cleanupPeerConnection]);

  // Handle room signaling WebSocket with robust auto-reconnection
  useEffect(() => {
    if (!roomCode) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxAttempts = 5;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = process.env.NEXT_PUBLIC_WS_URL || `${window.location.hostname}:3001`;
      const wsUrl = `${protocol}//${wsHost}`;

      console.log(`[WebSocket] Connecting to signaling: ${wsUrl} (Attempt ${attempts + 1}/${maxAttempts})`);
      const ws = new WebSocket(wsUrl);
      socket = ws;
      socketRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) {
          ws.close();
          return;
        }
        console.log("[WebSocket] Connection open, joining room:", roomCode);
        attempts = 0; // Reset reconnection attempts on success
        ws.send(JSON.stringify({
          type: "join-room",
          code: roomCode,
        }));
      };

      ws.onmessage = async (event) => {
        if (isUnmounted) return;

        try {
          const data = JSON.parse(event.data);

          if (data.type === "room-joined") {
            console.log("[WebSocket] Successfully joined room:", data.code);
          } else if (data.type === "peer-info") {
            setPeerId(data.peerId);
          } else if (data.type === "peer-joined") {
            console.log("[WebSocket] Peer joined, generating WebRTC offer");
            setPeerId(data.peerId);
            initPeerConnection(ws, true);
          } else if (data.type === "signal") {
            const pc = peerConnectionRef.current || initPeerConnection(ws, false);
            
            if (data.data.sdp) {
              const desc = new RTCSessionDescription(data.data.sdp);
              await pc.setRemoteDescription(desc);

              if (desc.type === "offer") {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({
                  type: "signal",
                  data: { sdp: pc.localDescription },
                }));
              }
            } else if (data.data.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(data.data.candidate));
              } catch (candidateErr) {
                console.warn("Error adding Ice Candidate:", candidateErr);
              }
            }
          } else if (data.type === "peer-disconnected") {
            toast.warning("Peer disconnected.");
            cleanupPeerConnection();
            setPeerId(null);
            if (onPeerDisconnected) onPeerDisconnected();
          } else if (data.type === "error") {
            toast.error(`Signaling error: ${data.message}`);
            if (data.message === "room-full" || data.message === "room-not-found") {
              setConnectionStatus("disconnected");
              // Do not try to reconnect for fatal business-logic errors
              attempts = maxAttempts;
            }
          }
        } catch (err) {
          console.error("Error processing websocket message:", err);
        }
      };

      ws.onclose = (event) => {
        if (isUnmounted) return;
        console.log(`[WebSocket] Connection closed. Reason: ${event.reason || "No reason provided"}`);
        
        // Reconnect if not closed intentionally or hit max attempts
        if (attempts < maxAttempts) {
          reconnectTimeout = setTimeout(() => {
            attempts++;
            connect();
          }, 3000);
        } else {
          setConnectionStatus("disconnected");
          toast.error("Signaling connection lost. Please refresh the page.");
        }
      };

      ws.onerror = (err) => {
        console.warn("[WebSocket] Connection error (attempting auto-reconnect)...", err);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (socket) {
        socketRef.current = null;
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      cleanupPeerConnection();
    };
  }, [roomCode, initPeerConnection, cleanupPeerConnection, onPeerDisconnected]);

  return {
    connectionStatus,
    clipboardHistory,
    fileTransfer,
    peerId,
    sendText,
    sendFile,
  };
}
