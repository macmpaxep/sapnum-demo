/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/demo", destination: "/feed", permanent: true },
      { source: "/demo/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
