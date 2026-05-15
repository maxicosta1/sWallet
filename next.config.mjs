/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  async rewrites() {
    return [
      {
        source: "/app",
        destination: "/index.html"
      }
    ];
  }
};

export default nextConfig;
