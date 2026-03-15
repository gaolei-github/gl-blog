import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'GL-博客',
  description: 'documentation style web module',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>): JSX.Element {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}
