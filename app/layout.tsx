import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans, Noto_Sans_Bengali } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-noto-sans', display: 'swap' })
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-noto-bengali', display: 'swap' })

export const metadata: Metadata = {
  title: 'OrderBridge — Chat-to-order for Bangladesh',
  description:
    'One conversation. One confirmed order. One place to track everything. Bilingual chat, AI-assisted orders, verification, reviews and courier tracking for small online businesses in Bangladesh.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoBengali.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
