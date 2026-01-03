import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
    title: 'ระบบจัดการใบอนุญาตร้านค้า',
    description: 'Shop License Management System',
    icons: {
        icon: '/favicon.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="th">
            <head>
                {/* DNS Prefetch for faster external resource loading */}
                <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
                <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

                {/* Preconnect for critical resources */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* Font Awesome - standard loading */}
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                />

                {/* Google Fonts - optimized with display=swap */}
                <link
                    rel="preload"
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
                    as="style"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}
