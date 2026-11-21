/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,

  partialPrefetching: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  experimental: {
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
};

export default nextConfig;
