import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";

interface Client {
  ws: WebSocket;
  id: string;
}

interface Room {
  code: string;
  clients: Client[];
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const MAX_MESSAGE_SIZE = 64 * 1024; // 64 KB limit for signaling payloads to prevent memory DoS

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ClipBridge Signaling Server is running.\n");
});

const wss = new WebSocketServer({ server });

// Active rooms map
const rooms = new Map<string, Room>();

// Helper to generate a secure 5-character alphanumeric room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789"; // Removed similar looking characters like I, 1, O, 0
  let attempts = 0;
  while (attempts < 1000) {
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!rooms.has(code)) {
      return code;
    }
    attempts++;
  }
  throw new Error("Failed to generate unique room code");
}

// Helper to validate room code format
function isValidRoomCode(code: string): boolean {
  return /^[A-Z2-9]{5}$/.test(code);
}

// Generate a random client ID
function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15);
}

wss.on("connection", (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  const clientId = generateClientId();

  console.log(`[Server] Client connected: ${clientId}`);

  ws.on("message", (message: string) => {
    // 1. Limit message size to prevent DoS
    if (message.length > MAX_MESSAGE_SIZE) {
      console.warn(`[Server] Client ${clientId} sent message exceeding size limit. Closing connection.`);
      ws.close(1009, "Message size limit exceeded");
      return;
    }

    try {
      const data = JSON.parse(message);
      if (!data || typeof data.type !== "string") {
        ws.send(JSON.stringify({ type: "error", message: "invalid-message-format" }));
        return;
      }

      switch (data.type) {
        case "create-room": {
          const code = generateRoomCode();
          const room: Room = {
            code,
            clients: [],
          };

          rooms.set(code, room);

          // Clean up the room if no one joins within 30 seconds to prevent leaks
          setTimeout(() => {
            const r = rooms.get(code);
            if (r && r.clients.length === 0) {
              rooms.delete(code);
              console.log(`[Server] Empty room auto-cleaned: ${code}`);
            }
          }, 30000);

          ws.send(JSON.stringify({ type: "room-created", code }));
          console.log(`[Server] Room registered: ${code}`);
          break;
        }

        case "join-room": {
          const rawCode = data.code;
          if (typeof rawCode !== "string") {
            ws.send(JSON.stringify({ type: "error", message: "invalid-room-code" }));
            return;
          }

          const code = rawCode.trim().toUpperCase();
          if (!isValidRoomCode(code)) {
            ws.send(JSON.stringify({ type: "error", message: "invalid-room-code-format" }));
            return;
          }

          // If already in a room, leave it first
          if (currentRoomCode) {
            leaveCurrentRoom();
          }

          const room = rooms.get(code);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "room-not-found" }));
            return;
          }

          // SECURITY: Limit to exactly 2 clients to prevent eavesdropping
          if (room.clients.length >= 2) {
            ws.send(JSON.stringify({ type: "error", message: "room-full" }));
            console.warn(`[Server] Client ${clientId} blocked from joining full room: ${code}`);
            return;
          }

          room.clients.push({ ws, id: clientId });
          currentRoomCode = code;

          ws.send(JSON.stringify({ type: "room-joined", code }));
          
          // Notify the other client in the room to start WebRTC negotiation
          const peer = room.clients.find(c => c.id !== clientId);
          if (peer) {
            peer.ws.send(JSON.stringify({ type: "peer-joined", peerId: clientId }));
            ws.send(JSON.stringify({ type: "peer-info", peerId: peer.id }));
          }

          console.log(`[Server] Client ${clientId} joined room: ${code}`);
          break;
        }

        case "signal": {
          if (!currentRoomCode) {
            ws.send(JSON.stringify({ type: "error", message: "not-in-room" }));
            return;
          }

          const room = rooms.get(currentRoomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "room-not-found" }));
            return;
          }

          // Find the peer in the room and route the signaling data
          const peer = room.clients.find(c => c.id !== clientId);
          if (peer) {
            peer.ws.send(JSON.stringify({
              type: "signal",
              data: data.data,
            }));
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ type: "error", message: "unknown-message-type" }));
      }
    } catch (err) {
      console.error("[Server] Error parsing client message:", err);
      ws.send(JSON.stringify({ type: "error", message: "invalid-json" }));
    }
  });

  ws.on("close", () => {
    console.log(`[Server] Client disconnected: ${clientId}`);
    leaveCurrentRoom();
  });

  ws.on("error", (error) => {
    console.error(`[Server] WebSocket error on client ${clientId}:`, error);
  });

  function leaveCurrentRoom() {
    if (!currentRoomCode) return;

    const room = rooms.get(currentRoomCode);
    if (room) {
      // Remove this client from the room
      room.clients = room.clients.filter(c => c.id !== clientId);
      console.log(`[Server] Client ${clientId} left room: ${currentRoomCode}`);

      if (room.clients.length === 0) {
        // Clean up empty room
        rooms.delete(currentRoomCode);
        console.log(`[Server] Room deleted because it's empty: ${currentRoomCode}`);
      } else {
        // Notify the remaining client
        for (const client of room.clients) {
          client.ws.send(JSON.stringify({ type: "peer-disconnected" }));
        }
      }
    }
    currentRoomCode = null;
  }
});

server.on("error", (err) => {
  console.error("[Server] HTTP server error:", err);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Secure signaling server listening on port ${PORT}`);
});
