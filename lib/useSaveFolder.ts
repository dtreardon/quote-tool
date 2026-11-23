import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

const DB_NAME = 'QuoteSheetPRO'
const DB_VERSION = 1
const STORE = 'settings'
const HANDLE_KEY = 'saveFolderHandle'
const RW = { mode: 'readwrite' as const }

// Every browser storage / file-system step gets this long. Chrome can jam these
// calls so they never resolve; a timeout counts as a failure, never a hang.
const STEP_TIMEOUT_MS = 5000

function withTimeout<T>(p: Promise<T>, step: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${STEP_TIMEOUT_MS / 1000}s: ${step}`)), STEP_TIMEOUT_MS)
  })
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer))
}

// ── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = setTimeout(() => {
      settled = true
      reject(new Error(`Timed out after ${STEP_TIMEOUT_MS / 1000}s: open settings database`))
    }, STEP_TIMEOUT_MS)
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => {
      const db = req.result
      if (settled) { db.close(); return } // opened after we gave up — don't leak it
      settled = true
      clearTimeout(timer)
      // Let another tab upgrade or delete the database instead of blocking it
      db.onversionchange = () => db.close()
      resolve(db)
    }
    req.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(req.error)
    }
  })
}

// One request against the settings store, time-limited, closing the connection after
async function runStore<T>(mode: IDBTransactionMode, step: string, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB()
  try {
    return await withTimeout(new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    }), step)
  } finally {
    db.close()
  }
}

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const h = await runStore('readonly', 'read save folder', s => s.get(HANDLE_KEY))
    return (h as FileSystemDirectoryHandle | undefined) ?? null
  } catch (err) {
    console.warn('[useSaveFolder] Could not load the save folder:', err)
    return null
  }
}

async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await runStore('readwrite', 'store save folder', s => s.put(handle, HANDLE_KEY))
}

async function clearStoredHandle(): Promise<void> {
  try {
    await runStore('readwrite', 'clear save folder', s => s.delete(HANDLE_KEY))
  } catch {
    // ignore — best-effort cleanup
  }
}

// ── File writing ───────────────────────────────────────────────────────────

async function writeToFolder(dir: FileSystemDirectoryHandle, filename: string, data: ArrayBuffer): Promise<void> {
  const fh = await withTimeout(dir.getFileHandle(filename, { create: true }), 'open file in save folder')
  const writable = await withTimeout(fh.createWritable(), 'start writing file')
  try {
    await withTimeout(writable.write(data), 'write file')
    await withTimeout(writable.close(), 'finish writing file')
  } catch (err) {
    writable.abort().catch(() => {}) // discard the partial write; ignore if already closed
    throw err
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

const subscribeNever = () => () => {}
const detectFolderPicker = () =>
  'showDirectoryPicker' in window && typeof window.showDirectoryPicker === 'function'

// 'no-folder': folder saving isn't available or no folder is set — download instead
// 'failed':    a folder is set but saving to it failed or timed out — download instead
export type SaveResult = 'saved' | 'no-folder' | 'failed'

// Which notice to show after a download fallback (null = none)
//  'no-folder': this browser can save to a folder but none has been chosen yet
//  'failed':    saving to the chosen folder failed or timed out
export type FolderNotice = 'no-folder' | 'failed' | null

// Accepts ArrayBuffer so callers can pass res.arrayBuffer() directly without
// an intermediate Uint8Array (avoids TS5 SharedArrayBuffer assignability issues).
export function useSaveFolder() {
  const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [folderName, setFolderName] = useState<string | null>(null)
  // Set when a save fell back to a download; cleared by a successful save or a new folder
  const [folderError, setFolderError] = useState<FolderNotice>(null)

  // Feature detection — works in Chrome/Edge; not Safari/Firefox.
  // Server render (and hydration) always report false, then the browser value is
  // used — avoids the hydration mismatch from checking `window` during render.
  const isSupported = useSyncExternalStore(subscribeNever, detectFolderPicker, () => false)

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

  // Must be called straight from a click: Chrome only shows the picker (and its
  // write-access prompt) during a user gesture. Also used by "Reconnect Folder".
  const pickFolder = useCallback(async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isSupported) return null
    let h: FileSystemDirectoryHandle
    try {
      h = await window.showDirectoryPicker(RW)
    } catch {
      // User cancelled the picker (or refused write access) — not an error
      return null
    }
    setHandle(h)
    setFolderName(h.name)
    setFolderError(null)
    try {
      await storeHandle(h)
    } catch (err) {
      // Still usable for this session; it just won't be remembered next time
      console.warn('[useSaveFolder] Could not remember the save folder:', err)
    }
    return h
  }, [isSupported])

  const clearFolder = useCallback(async () => {
    setHandle(null)
    setFolderName(null)
    setFolderError(null)
    await clearStoredHandle()
  }, [])

  const dismissFolderError = useCallback(() => setFolderError(null), [])

  /**
   * Call as the FIRST await in a save click handler, before building the PDF,
   * while Chrome still treats it as a user gesture. Checks write permission on
   * the save folder and, if it isn't granted, asks Chrome to show its allow prompt.
   * Never throws and never hangs; resolves true only if saving to the folder may proceed.
   */
  const prepareFolder = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !handle) return false
    try {
      if ((await withTimeout(handle.queryPermission(RW), 'check folder permission')) === 'granted') return true
      return (await withTimeout(handle.requestPermission(RW), 'ask for folder permission')) === 'granted'
    } catch (err) {
      console.warn('[useSaveFolder] Folder permission check failed:', err)
      return false
    }
  }, [handle, isSupported])

  /**
   * Write an ArrayBuffer to the save folder. Never prompts, never throws, never hangs.
   * `permitted` is the result of prepareFolder() from the same click.
   * On 'no-folder' or 'failed' the caller downloads the file instead.
   */
  const saveFile = useCallback(async (
    filename: string,
    data: ArrayBuffer,
    permitted: boolean,
  ): Promise<SaveResult> => {
    if (!isSupported) return 'no-folder' // browser can't save to folders — plain download, no notice
    if (!handle) {
      setFolderError('no-folder')
      return 'no-folder'
    }
    try {
      if (!permitted) throw new Error('Write permission for the save folder was not granted')
      await writeToFolder(handle, filename, data)
      setFolderError(null)
      return 'saved'
    } catch (err) {
      console.warn('[useSaveFolder] Could not save to the folder:', err)
      setFolderError('failed')
      return 'failed'
    }
  }, [handle, isSupported])

  return {
    isSupported, folderName, handle, folderError,
    pickFolder, clearFolder, prepareFolder, saveFile, dismissFolderError,
  }
}
