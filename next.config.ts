import type { NextConfig } from "next";

const siteIndexable = process.env.SITE_INDEXING === "true";

const nextConfig: NextConfig = {
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

    if (siteIndexable) {
      return staticAssetHeaders;
    }

    return [
      ...staticAssetHeaders,
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
  images: {
    // WooCommerce images are served from shop.motorock.eu; bypass Vercel /_next/image
    // (Image Optimization quota returns 402 on this project).
    unoptimized: true,
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
