import { ClipboardItem } from "@/hooks/useWebRTC";

const DB_NAME = "clipbridge_db";
const DB_VERSION = 1;
const STORE_NAME = "history";

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in the browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("roomCode", "roomCode", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Save a single clipboard item to IndexedDB
export async function saveHistoryItem(roomCode: string, item: ClipboardItem): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const record = {
        ...item,
        roomCode,
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.error("Failed to save history item to IndexedDB:", err);
  }
}

// Bulk save items (useful for P2P merging)
export async function saveHistoryItems(roomCode: string, items: ClipboardItem[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = (e) => reject(e);

      items.forEach((item) => {
        store.put({
          ...item,
          roomCode,
        });
      });
    });
  } catch (err) {
    console.error("Failed to bulk-save history items to IndexedDB:", err);
  }
}

// Get history items for a specific room, sorted by timestamp descending, limited to last 50 items
export async function getRoomHistory(roomCode: string): Promise<ClipboardItem[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("roomCode");
      
      // Query items for this room code
      const request = index.getAll(IDBKeyRange.only(roomCode));

      request.onsuccess = () => {
        const results = request.result as Array<ClipboardItem & { roomCode: string }>;
        
        // Sort by timestamp descending
        const sorted = results
          .map(({ roomCode: _, ...item }) => item) // Remove DB-specific roomCode field
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50); // Limit to last 50 items
          
        resolve(sorted);
      };

      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.error("Failed to read room history from IndexedDB:", err);
    return [];
  }
}

// Delete history items for a specific room
export async function clearRoomHistory(roomCode: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("roomCode");

      const request = index.openCursor(IDBKeyRange.only(roomCode));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = (e) => reject(e);
    });
  } catch (err) {
    console.error("Failed to clear room history from IndexedDB:", err);
  }
}
