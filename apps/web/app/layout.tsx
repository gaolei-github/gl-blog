import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'gl docs',
  description: 'documentation style web module',
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
