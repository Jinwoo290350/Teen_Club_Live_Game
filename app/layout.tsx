import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-noto-sans-thai',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Teen Club Live | แบบประเมินความรู้สุขภาพทางเพศวัยรุ่น',
  description: 'แบบประเมินความรู้และทักษะทางเพศสำหรับวัยรุ่น โดยกรมอนามัย กระทรวงสาธารณสุข',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFB6C1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body className={`${notoSansThai.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
