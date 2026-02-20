/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      { source: '/Aktien', destination: '/', permanent: false },
      { source: '/aktien', destination: '/', permanent: false },
      { source: '/login', destination: '/', permanent: false },
      { source: '/register', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
