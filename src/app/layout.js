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
                <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

                {/* Preconnect for critical resources */}
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* Google Fonts - Inter and Noto Sans Thai */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />

                {/* Font Awesome - load directly */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                    crossOrigin="anonymous"
                />
            </head>
            <body>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
