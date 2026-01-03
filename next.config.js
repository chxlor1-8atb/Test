/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development
    reactStrictMode: true,

    // Optimize images
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Compiler optimizations
    compiler: {
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Experimental optimizations
    experimental: {
        // Optimize package imports
        optimizePackageImports: ['chart.js', 'react-chartjs-2', 'sweetalert2'],
    },

    // Headers for caching static assets
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
}

module.exports = nextConfig
