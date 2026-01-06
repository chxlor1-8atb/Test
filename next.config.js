/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development
    reactStrictMode: true,

    // Optimize images (reduce bandwidth & CPU)
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
    },

    // Compiler optimizations
    compiler: {
        // Remove console.log in production (reduce bundle & security)
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Experimental optimizations (reduce bundle size significantly)
    experimental: {
        // Optimize package imports - tree shake unused exports
        optimizePackageImports: [
            'chart.js', 
            'react-chartjs-2', 
            'sweetalert2',
            'bcryptjs',
            '@neondatabase/serverless',
            'iron-session'
        ],
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
