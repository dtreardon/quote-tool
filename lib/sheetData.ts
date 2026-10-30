// Recall: the complete form state is embedded in every saved PDF as a file
// attachment (qsp-data.json), so a saved sheet can be loaded back exactly.
// The visible pages are untouched. pdf-lib is loaded on demand to keep it out
// of the initial bundle.

import type { PDFDict as PDFDictT } from 'pdf-lib'

export const SHEET_DATA_FILENAME = 'qsp-data.json'
export const SHEET_DATA_SCHEMA = 1

export type SheetType = 'HO' | 'Auto'

export interface SheetPayload<T = unknown> {
  schema: number
  sheet: SheetType
  savedAt: string
  form: T
}

// Cross-sheet hand-off: an HO file recalled on the Auto sheet (or vice versa)
// is parked here and picked up by the correct sheet after navigation.
export const RECALL_HANDOFF_KEY = 'qspRecall'

export const SHEET_PATHS: Record<SheetType, string> = { HO: '/', Auto: '/auto' }

export async function embedSheetData(pdf: ArrayBuffer, sheet: SheetType, form: unknown): Promise<ArrayBuffer> {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.load(pdf, { updateMetadata: false })
  const payload: SheetPayload = { schema: SHEET_DATA_SCHEMA, sheet, savedAt: new Date().toISOString(), form }
  const now = new Date()
  await doc.attach(new TextEncoder().encode(JSON.stringify(payload)), SHEET_DATA_FILENAME, {
    mimeType: 'application/json',
    description: 'QuoteSheetPRO sheet data (used by Recall)',
    creationDate: now,
    modificationDate: now,
  })
  const bytes = await doc.save()
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

export type ReadResult =
  | { status: 'ok'; payload: SheetPayload }
  | { status: 'no-data' }       // valid PDF saved before Recall existed (or not a QSP sheet)
  | { status: 'unreadable' }    // not a PDF / corrupt

export async function readSheetData(file: File): Promise<ReadResult> {
  const lib = await import('pdf-lib')
  const { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString, PDFRawStream, decodePDFRawStream } = lib

  let doc
  try {
    doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false })
  } catch {
    return { status: 'unreadable' }
  }

  try {
    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict)
    const root  = names?.lookupMaybe(PDFName.of('EmbeddedFiles'), PDFDict)
    if (!root) return { status: 'no-data' }

    // Walk the EmbeddedFiles name tree (flat Names array and/or Kids)
    const findSpec = (node: PDFDictT): PDFDictT | null => {
      const arr = node.lookupMaybe(PDFName.of('Names'), PDFArray)
      if (arr) {
        for (let i = 0; i + 1 < arr.size(); i += 2) {
          const key = arr.lookup(i)
          const name = key instanceof PDFString || key instanceof PDFHexString ? key.decodeText() : ''
          if (name === SHEET_DATA_FILENAME) return arr.lookupMaybe(i + 1, PDFDict) ?? null
        }
      }
      const kids = node.lookupMaybe(PDFName.of('Kids'), PDFArray)
      if (kids) {
        for (let i = 0; i < kids.size(); i++) {
          const kid = kids.lookupMaybe(i, PDFDict)
          const found = kid && findSpec(kid)
          if (found) return found
        }
      }
      return null
    }

    const spec = findSpec(root)
    const stream = spec?.lookupMaybe(PDFName.of('EF'), PDFDict)?.lookup(PDFName.of('F'))
    if (!(stream instanceof PDFRawStream)) return { status: 'no-data' }

    const json = new TextDecoder().decode(decodePDFRawStream(stream).decode())
    const payload = JSON.parse(json) as SheetPayload
    if (!payload || typeof payload !== 'object' || !payload.form || (payload.sheet !== 'HO' && payload.sheet !== 'Auto')) {
      return { status: 'no-data' }
    }
    return { status: 'ok', payload }
  } catch {
    return { status: 'no-data' }
  }
}

// Gives every list item a fresh, unique uid so restored rows can never collide
// with the per-section uid counters (which restart at small numbers on page load).
export function freshUids<T extends { uid: number }>(items: T[] | undefined, base: number): T[] {
  return (items ?? []).map((it, i) => ({ ...it, uid: base + i }))
}
