'use client'

interface FolderSaveNoticeProps {
  // 'no-folder': none chosen yet; 'failed': saving to the chosen folder failed or timed out
  kind: 'no-folder' | 'failed'
  folderName: string | null
  // Opens the folder picker; must run directly from the click so Chrome allows the prompt
  onPickFolder: () => void
  onDismiss: () => void
  className?: string
}

// Shown after a save fell back to a browser download
export function FolderSaveNotice({ kind, folderName, onPickFolder, onDismiss, className = '' }: FolderSaveNoticeProps) {
  const noFolder = kind === 'no-folder'
  return (
    <div role="alert" className={`flex items-start gap-3 text-[13px] text-[#7a4a00] bg-[#fff8e6] border border-[#f5d48a] rounded px-3 py-2 shadow-sm ${className}`}>
      <span className="flex-1">
        {noFolder ? (
          <>No save folder set. Your file was downloaded. Click Choose Folder to set one.</>
        ) : (
          <>
            Couldn&apos;t save to your folder{folderName ? ` (${folderName})` : ''}. Your file was downloaded instead.
            Click Reconnect Folder to fix this.
          </>
        )}
      </span>
      <button
        type="button"
        onClick={onPickFolder}
        className="shrink-0 bg-navy text-white rounded px-3 py-1 text-[12px] font-bold hover:bg-navy/90 transition-colors"
      >
        {noFolder ? 'Choose Folder' : 'Reconnect Folder'}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[#7a4a00]/60 hover:text-[#7a4a00] leading-none pt-1"
      >
        ✕
      </button>
    </div>
  )
}
