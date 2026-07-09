import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'QuoteSheetPRO'
const DB_VERSION = 1
const STORE = 'settings'
const HANDLE_KEY = 'saveFolderHandle'

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(handle, HANDLE_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const req = tx.objectStore(STORE).delete(HANDLE_KEY)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    // ignore — best-effort cleanup
  }
}

// ── Permission helpers ─────────────────────────────────────────────────────

async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const }
  // Browsers require re-checking permission each session for security
  if ((await handle.queryPermission(opts)) === 'granted') return true
  if ((await handle.requestPermission(opts)) === 'granted') return true
  return false
}

// ── Hook ──────────────────────────────────────────────────────────────────

export type SaveResult = 'saved' | 'downloaded' | 'failed'

// Accepts ArrayBuffer so callers can pass res.arrayBuffer() directly without
// an intermediate Uint8Array (avoids TS5 SharedArrayBuffer assignability issues).
export function useSaveFolder() {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)

  // Feature detection — works in Chrome/Edge; not Safari/Firefox
  const isSupported =
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    typeof window.showDirectoryPicker === 'function'

  // Load stored handle from IndexedDB on mount
  useEffect(() => {
    if (!isSupported) return
    getStoredHandle().then(h => {
      if (h) {
        setHandle(h)
        setFolderName(h.name)
      }
    })
  }, [isSupported])

  const pickFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isSupported) return null
    try {
      const h = await window.showDirectoryPicker({ mode: 'readwrite' })
      await storeHandle(h)
      setHandle(h)
      setFolderName(h.name)
      return h
    } catch {
      // User cancelled the picker — not an error
      return null
    }
  }, [isSupported])

  const clearFolder = useCallback(async () => {
    await clearStoredHandle()
    setHandle(null)
    setFolderName(null)
  }, [])

  /**
   * Write an ArrayBuffer to the saved folder. Falls back gracefully if:
   *  - No folder is set (prompts for one first)
   *  - Permission is denied/revoked
   *  - Folder has moved/been deleted
   *
   * Returns 'saved' on direct write, 'failed' if the user cancelled the picker.
   * The caller handles the download fallback.
   */
  const saveFile = useCallback(async (
    filename: string,
    data: ArrayBuffer,
  ): Promise<SaveResult> => {
    if (!isSupported) return 'failed'

    let h = handle

    // If no handle, prompt for a folder
    if (!h) {
      h = await pickFolder()
      if (!h) return 'failed'
    }

    // Per-session permission re-check (browsers require this)
    const ok = await verifyPermission(h)
    if (!ok) {
      // Permission denied — try picking a fresh folder
      h = await pickFolder()
      if (!h) return 'failed'
    }

    const doWrite = async (dir: FileSystemDirectoryHandle): Promise<boolean> => {
      try {
        const fh = await dir.getFileHandle(filename, { create: true })
        const writable = await fh.createWritable()
        await writable.write(data)
        await writable.close()
        return true
      } catch {
        return false
      }
    }

    if (await doWrite(h)) return 'saved'

    // Write failed (folder moved/deleted) — clear stale handle and re-pick
    await clearStoredHandle()
    setHandle(null)
    setFolderName(null)

    h = await pickFolder()
    if (!h) return 'failed'

    return (await doWrite(h)) ? 'saved' : 'failed'
  }, [handle, isSupported, pickFolder])

  return { isSupported, folderName, handle, pickFolder, clearFolder, saveFile }
}
