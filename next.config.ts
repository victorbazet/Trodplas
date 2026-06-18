import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (listing images).
      // Replace the wildcard host once you know your project ref, or keep it permissive for dev.
      { protocol: "https", hostname: "*.supabase.co" },
      // Unsplash is used by the seed script for demo listing images.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Picsum provides deterministic placeholder photos for the seed script.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
