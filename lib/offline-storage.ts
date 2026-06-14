/**
 * EchoVault Offline Storage
 *
 * Uses IndexedDB (via the `idb` library) to cache documents locally.
 * This enables offline reading and queued writes that sync when back online.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface EchoVaultDB extends DBSchema {
  documents: {
    key: string;
    value: {
      id:        string;
      title:     string;
      content:   string;  // Encrypted ciphertext
      emoji:     string;
      updatedAt: number;  // Unix timestamp
      synced:    boolean; // false = has pending local changes
    };
    indexes: { by_updated: number };
  };
  pending_writes: {
    key: string; // document id
    value: {
      documentId: string;
      content:    string;
      title:      string;
      queuedAt:   number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<EchoVaultDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null; // SSR guard

  if (!dbPromise) {
    dbPromise = openDB<EchoVaultDB>("echovault", 1, {
      upgrade(db) {
        // Documents store
        const docStore = db.createObjectStore("documents", { keyPath: "id" });
        docStore.createIndex("by_updated", "updatedAt");

        // Pending writes store (for offline sync)
        db.createObjectStore("pending_writes", { keyPath: "documentId" });
      },
    });
  }

  return dbPromise;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function saveDocumentOffline(doc: {
  id:        string;
  title:     string;
  content:   string;
  emoji:     string;
  updatedAt: Date | string;
}) {
  const db = await getDB();
  if (!db) return;

  await db.put("documents", {
    id:        doc.id,
    title:     doc.title,
    content:   doc.content,
    emoji:     doc.emoji,
    updatedAt: new Date(doc.updatedAt).getTime(),
    synced:    true,
  });
}

export async function getDocumentOffline(id: string) {
  const db = await getDB();
  if (!db) return null;
  return db.get("documents", id);
}

export async function getAllDocumentsOffline() {
  const db = await getDB();
  if (!db) return [];
  return db.getAllFromIndex("documents", "by_updated");
}

export async function markDocumentUnsynced(id: string, content: string, title: string) {
  const db = await getDB();
  if (!db) return;

  // Update local copy
  const existing = await db.get("documents", id);
  if (existing) {
    await db.put("documents", { ...existing, content, title, synced: false });
  }

  // Queue the write for when online
  await db.put("pending_writes", {
    documentId: id,
    content,
    title,
    queuedAt: Date.now(),
  });
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export async function getPendingWrites() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll("pending_writes");
}

export async function clearPendingWrite(documentId: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete("pending_writes", documentId);

  // Mark as synced
  const doc = await db.get("documents", documentId);
  if (doc) {
    await db.put("documents", { ...doc, synced: true });
  }
}

// ─── Online/Offline Detection ─────────────────────────────────────────────────

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function onOnline(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  return () => window.removeEventListener("online", callback);
}
