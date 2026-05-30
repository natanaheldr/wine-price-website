import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Lista de Preços | Vinhos, Champagne e Fernet | Preços atualizados',
  description: 'Lista de preços atualizada de vinhos, champagne e fernet na Argentina. Preços em Pesos Argentinos (ARS), Reais (BRL) e PIX. Envie seu pedido pelo WhatsApp.',
  keywords: ['vinhos', 'vinos', 'champagne', 'fernet', 'lista de preços', 'preços vinhos', 'argentina', 'comprar vinho', 'preços atualizados'],
  openGraph: {
    title: 'Lista de Preços | Vinhos, Champagne e Fernet',
    description: 'Lista de preços atualizada de vinhos, champagne e fernet. Preços em ARS, BRL e PIX. Envie seu pedido pelo WhatsApp.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Lista de Preços',
    url: 'https://natanaheldr.github.io/wine-price-website/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lista de Preços | Vinhos, Champagne e Fernet',
    description: 'Lista de preços atualizada de vinhos, champagne e fernet. Preços em ARS, BRL e PIX.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://natanaheldr.github.io/wine-price-website/',
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Lista de Preços - Vinhos, Champagne e Fernet',
            url: 'https://natanaheldr.github.io/wine-price-website/',
            description: 'Lista de preços atualizada de vinhos, champagne e fernet na Argentina. Preços em ARS, BRL e PIX.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://natanaheldr.github.io/wine-price-website/?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }} />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
