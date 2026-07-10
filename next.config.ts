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
    ],
  },
};

export default nextConfig;
