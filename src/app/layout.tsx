import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React, { Suspense } from 'react';
import './globals.css';
import { RewardProvider } from './context/RewardContext';
import { AuthProvider } from './context/AuthContext';
import Splash from './components/Splash';
import PwaInstallRedirectClient from './components/PwaInstallRedirectClient';
import PostHogClient from './components/PostHogClient';
import BottomNavShell from './components/BottomNavShell';
import { BottomNavProvider } from './context/BottomNavContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ZK.',
  description: 'ZK.',
  icons: {
    icon: '/favicon.ico?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className='bg-gray-900'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <link rel='manifest' href='/manifest.json' crossOrigin='use-credentials' />
        <meta name='theme-color' content='#0B0C0F' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
        <meta name='apple-mobile-web-app-title' content='ZK.' />
        <meta name='mobile-web-app-capable' content='yes' />
        <link rel='icon' href='/favicon.ico?v=2' />
        <style>{`
          :root {
            --safe-area-top: env(safe-area-inset-top, 0px);
            --safe-area-bottom: env(safe-area-inset-bottom, 0px);
            --safe-area-left: env(safe-area-inset-left, 0px);
            --safe-area-right: env(safe-area-inset-right, 0px);
          }
          
          html {
            height: 100%;
            overflow: hidden;
          }
          
          body {
            height: 100vh;
            height: calc(100vh - var(--safe-area-top) - var(--safe-area-bottom));
            min-height: -webkit-fill-available;
            overflow: hidden;
            position: fixed;
            width: 100%;
            top: 0;
            left: 0;
          }
          
          #root-wrapper {
            height: 100vh;
            padding-top: var(--safe-area-top);
            padding-left: var(--safe-area-left);
            padding-right: var(--safe-area-right);
            box-sizing: border-box;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
          }
        `}</style>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}>
        {/* Safe Area対応のステータスバー背景（固定配置） */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--safe-area-top)',
            backgroundColor: '#0B0C0F',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />

        {/* Safe Area対応のボトムバー背景（固定配置） */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--safe-area-bottom)',
            backgroundColor: '#0B0C0F',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />

        <div id='root-wrapper'>
          <AuthProvider>
            <RewardProvider>
              <BottomNavProvider>
                <Suspense fallback={null}>
                  <PwaInstallRedirectClient />
                  <PostHogClient />
                </Suspense>
                <Splash />
                {children}
                <BottomNavShell />
              </BottomNavProvider>
            </RewardProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
