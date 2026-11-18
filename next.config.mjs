/** @type {import('next').NextConfig} */
const backendApiUrl = (process.env.BACKEND_API_URL || "http://127.0.0.1:8080").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
