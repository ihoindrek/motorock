import type { NextConfig } from "next";

const siteIndexable = process.env.SITE_INDEXING === "true";

const nextConfig: NextConfig = {
  trailingSlash: false,
  outputFileTracingIncludes: {
    "/api/ai/generate": ["./src/lib/ai/prompts/templates/*.yaml"],
    "/api/ai/batch": ["./src/lib/ai/prompts/templates/*.yaml"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "swiper"],
  },
  async headers() {
    const staticAssetHeaders = [
      {
        source: "/:path*\\.(webp|png|jpg|jpeg|svg|ico|mp4|webm|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];

    // Reputation scanners (Norton SafeWeb etc.) score sites down for missing
    // security headers. Scripts are intentionally not restricted by CSP so
    // GTM, Stripe, and consent bootstrap keep working; the Permissions-Policy
    // leaves `payment` at its default so Stripe wallet iframes can delegate it.
    const securityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
      },
    ];

    const allPathHeaders = siteIndexable
      ? securityHeaders
      : [
          ...securityHeaders,
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ];

    return [
      ...staticAssetHeaders,
      {
        source: "/:path*",
        headers: allPathHeaders,
      },
    ];
  },
  images: {
    // Vercel /_next/image quota returns 402 on this project, so WooCommerce
    // images are resized via wsrv.nl in a custom loader instead.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "motorock.eu",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "www.motorock.eu",
        pathname: "/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "shop.motorock.eu",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
