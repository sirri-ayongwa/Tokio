import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans, Noto_Sans_Bengali, Space_Grotesk } from 'next/font/google'
import { Toaster } from 'sonner'
import { LangProvider } from '@/lib/i18n'
import './globals.css'

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-noto-sans', display: 'swap' })
const notoBengali = Noto_Sans_Bengali({ subsets: ['bengali'], variable: '--font-noto-bengali', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' })

export const metadata: Metadata = {
  title: 'Tokio — One conversation. One confirmed order. One place to track everything.',
  description:
    'Bilingual chat, AI-assisted orders, verification, reviews and courier tracking for shoppers and small online businesses in Bangladesh.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a140f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${notoSans.variable} ${notoBengali.variable} ${spaceGrotesk.variable}`}
    >
      <body className="font-sans antialiased">
        <LangProvider>{children}</LangProvider>
        <Toaster position="top-center" richColors closeButton />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
