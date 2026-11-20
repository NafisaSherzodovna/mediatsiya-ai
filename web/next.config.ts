import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Django URLs end with "/"; without this Next strips the slash before the /api rewrite (POST -> Django 500).
  skipTrailingSlashRedirect: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Local live mode: forward /api and /admin to the Django dev server.
    // On Netlify the proxy rules in /netlify.toml do this instead.
    if (process.env.NODE_ENV !== "development") return [];
    const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
    return [
      // keep Django's trailing slash: ":path*" alone drops it
      { source: "/api/:path*/", destination: `${backend}/api/:path*/` },
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/admin/:path*/", destination: `${backend}/admin/:path*/` },
      { source: "/admin/:path*", destination: `${backend}/admin/:path*` },
    ];
  },
};

export default nextConfig;
