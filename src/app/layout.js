import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter, Noto_Sans_Thai } from 'next/font/google';

// Optimize fonts with next/font - eliminates font CLS
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
    preload: true,
});

const notoSansThai = Noto_Sans_Thai({
    subsets: ['thai'],
    display: 'swap',
    variable: '--font-noto-thai',
    preload: true,
    weight: ['400', '500', '600', '700'],
});

export const metadata = {
    title: 'ระบบจัดการใบอนุญาตร้านค้า',
    description: 'Shop License Management System',
    icons: {
        icon: '/favicon.png',
    },
};

// Viewport configuration for better mobile experience
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#D97757',
};

export default function RootLayout({ children }) {
    return (
        <html lang="th" className={`${inter.variable} ${notoSansThai.variable}`}>
            <head>
                {/* DNS Prefetch for faster external resource loading */}
                <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

                {/* Preconnect for critical resources */}
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />

                {/* Font Awesome - async loading to prevent render blocking */}
                <link
                    rel="preload"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    as="style"
                    onLoad="this.onload=null;this.rel='stylesheet'"
                />
                <noscript>
                    <link
                        rel="stylesheet"
                        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    />
                </noscript>
            </head>
            <body>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
