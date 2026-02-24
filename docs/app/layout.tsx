import './global.css';
import { RootProvider } from '@hanzo/docs/ui/provider/base';
import { NextProvider } from '@hanzo/docs/core/framework/next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { SearchDialog } from '@/components/search-dialog';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Pars Improvement Proposals (PIPs) - Sovereign Infrastructure Standards',
    template: '%s | PIPs',
  },
  description: 'PIPs define standards for the Pars Network ecosystem - sovereign blockchain infrastructure for the Persian diaspora.',
  keywords: ['Pars', 'PIPs', 'proposals', 'governance', 'blockchain', 'privacy', 'Persian', 'diaspora', 'sovereign'],
  authors: [{ name: 'Pars DAO' }],
  metadataBase: new URL('https://pips.pars.network'),
  openGraph: {
    title: 'Pars Improvement Proposals (PIPs) - Sovereign Infrastructure Standards',
    description: 'Explore the technical foundations of the Pars Network - standards for sovereign infrastructure, privacy, governance, and DeFi for the Persian diaspora.',
    type: 'website',
    siteName: 'Pars Improvement Proposals',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Pars Improvement Proposals - Sovereign Infrastructure Standards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pars Improvement Proposals (PIPs) - Sovereign Infrastructure Standards',
    description: 'Standards for the Pars Network - sovereign infrastructure, privacy, and governance.',
    images: ['/twitter.png'],
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevent flash - respect system preference or stored preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('pars-pips-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (stored !== 'light' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-svh bg-background font-sans antialiased">
        <NextProvider>
          <RootProvider
            search={{
              enabled: false,
            }}
            theme={{
              enabled: true,
              defaultTheme: 'system',
              storageKey: 'pars-pips-theme',
            }}
          >
            <SearchDialog />
            <div className="relative flex min-h-svh flex-col bg-background">
              {children}
            </div>
          </RootProvider>
        </NextProvider>
      </body>
    </html>
  );
}
