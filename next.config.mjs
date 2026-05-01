/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  webpack: (config) => {
    // face-api.js references `fs` / `encoding` in node-only branches; stub them on the client
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
