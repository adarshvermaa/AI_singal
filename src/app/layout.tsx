import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://alphx.trade'),
  title: {
    default: 'ALPHX | Next-Gen AI Quantitative Crypto Terminal',
    template: '%s | ALPHX Terminal',
  },
  description:
    'Institutional-grade AI quantitative crypto trading terminal featuring multi-model machine learning signals, automated TradingView webhooks, real-time CoinDCX futures execution, and orderbook microstructure depth.',
  keywords: [
    'ALPHX',
    'AI crypto trading',
    'quantitative trading terminal',
    'CoinDCX futures bot',
    'algorithmic trading',
    'TradingView webhook execution',
    'crypto trading terminal',
    'orderbook depth imbalance',
    'crypto AI signals',
    'crypto quantitative desk',
  ],
  authors: [{ name: 'ALPHX Quantitative Labs' }],
  creator: 'ALPHX',
  publisher: 'ALPHX',
  applicationName: 'ALPHX Terminal',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ALPHX — Next-Gen AI Quantitative Crypto Terminal',
    description:
      'Institutional AI crypto trading platform powered by machine learning ensembles, automated webhook routing, and real-time exchange connectivity.',
    url: 'https://alphx.trade',
    siteName: 'ALPHX Terminal',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ALPHX AI Quantitative Crypto Terminal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALPHX — Next-Gen AI Quantitative Crypto Terminal',
    description:
      'Real-time AI algorithmic crypto desk with automated webhooks, risk management, and orderbook depth analysis.',
    images: ['/og-image.png'],
    creator: '@alphx_trade',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ALPHX Quantitative Terminal',
  operatingSystem: 'Web, Cloud',
  applicationCategory: 'FinanceApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Institutional-grade AI quantitative trading terminal with automated webhook routing and multi-model signals for crypto markets.',
  softwareVersion: '1.0.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0A0E17" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
