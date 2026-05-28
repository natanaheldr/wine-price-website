import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Lista de Precios | Vinos, Champagne y Fernet',
  description: 'Lista de precios actualizada de vinos, champagne y fernet. Precios en Pesos Argentinos, Reales y PIX. Actualizado diariamente.',
  keywords: ['vinos', 'champagne', 'fernet', 'lista de precios', 'precios vinos', 'argentina'],
  openGraph: {
    title: 'Lista de Precios | Vinos, Champagne y Fernet',
    description: 'Lista de precios actualizada de vinos, champagne y fernet. Precios en Pesos, Reales y PIX.',
    type: 'website',
    locale: 'es_AR',
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('lista-precios-theme');if(t==='light'){document.documentElement.classList.add('light')}document.documentElement.classList.add('theme-ready')}catch(e){}})()`
        }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
