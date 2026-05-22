import type { Metadata } from 'next'
import { Libre_Baskerville, Source_Sans_3 } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-source-sans',
})

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
})

export const metadata: Metadata = {
  title: 'Quote Sheet — Robinson & Associates',
  description: 'Homeowners & Flood Insurance Quote Sheet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${libreBaskerville.variable}`}>
      <body className="min-h-screen bg-cream font-sans antialiased">
        <header className="bg-navy sticky top-0 z-50 shadow-lg print:hidden">
          <div className="max-w-[980px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo-blue.png" alt="Robinson & Associates" height={56} width={140} className="object-contain" priority />
            </div>
            <div className="text-right font-serif whitespace-nowrap">
              <div className="flex flex-col items-end gap-0.5">
                <strong className="text-white text-sm leading-tight">Homeowners &amp; Flood</strong>
                <span className="text-white/70 text-xs tracking-wide">Quote Sheet</span>
              </div>
            </div>
          </div>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #c8922a, #e8b44a, #c8922a)' }} />
        </header>
        {children}
      </body>
    </html>
  )
}
