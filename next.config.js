/**
 * When Cloudinary isn't configured the API serves uploads off its own disk, so
 * next/image has to be told that host is allowed. Derived from the API URL
 * rather than hardcoded, so a new backend hostname needs no code change.
 */
function apiImagePattern() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];

  try {
    const { protocol, hostname, port } = new URL(apiUrl);
    return [
      {
        protocol: protocol.replace(':', ''),
        hostname,
        ...(port ? { port } : {}),
        pathname: '/uploads/**',
      },
    ];
  } catch {
    console.warn(`[next.config] NEXT_PUBLIC_API_URL is not a valid URL: ${apiUrl}`);
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emits .next/standalone (server.js + only the traced node_modules) for the
  // Docker image. Vercel ignores it.
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 's3.amazonaws.com', 'images.unsplash.com'],
    remotePatterns: [
      // Local filesystem fallback for uploaded images when Cloudinary isn't configured
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      ...apiImagePattern(),
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Faster builds in development
  swcMinify: true,
  // Prevent build hanging on Vercel
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  // Optimize memory usage
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  async rewrites() {
    const rules = [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ];

    /**
     * The OMS is a separate Next app served at paribelle.in/pom through a
     * Vercel multi-zone. It genuinely serves under that prefix (its own
     * next.config sets basePath: "/pom"), so these are straight pass-throughs,
     * not path strips. Guarded on OMS_ORIGIN so a local dev server with no OMS
     * to proxy to just 404s /pom rather than rewriting to "undefined/pom".
     */
    if (process.env.OMS_ORIGIN) {
      rules.push(
        { source: '/pom', destination: `${process.env.OMS_ORIGIN}/pom` },
        { source: '/pom/:path*', destination: `${process.env.OMS_ORIGIN}/pom/:path*` },
      );
    }

    return rules;
  },
};

module.exports = nextConfig;
