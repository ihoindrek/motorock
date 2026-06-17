import type { NextConfig } from "next";

const siteIndexable = process.env.SITE_INDEXING === "true";

const nextConfig: NextConfig = {
  async headers() {
    if (siteIndexable) {
      return [];
    }

    return [
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
