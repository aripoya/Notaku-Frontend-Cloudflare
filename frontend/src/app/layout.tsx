// File: src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'  // Import existing providers

// Initialize Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

// Metadata for the app
export const metadata: Metadata = {
  title: 'Notaku - UMKM Management System',
  description: 'Platform untuk pengelolaan UMKM Indonesia',
  keywords: 'UMKM, management, Indonesia, bisnis, usaha kecil menengah',
  authors: [{ name: 'Notaku Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Notaku - UMKM Management System',
    description: 'Platform untuk pengelolaan UMKM Indonesia',
    url: 'https://www.notaku.cloud',
    siteName: 'Notaku',
    images: [
      {
        url: 'https://www.notaku.cloud/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Notaku Platform',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notaku - UMKM Management System',
    description: 'Platform untuk pengelolaan UMKM Indonesia',
    images: ['https://www.notaku.cloud/twitter-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
