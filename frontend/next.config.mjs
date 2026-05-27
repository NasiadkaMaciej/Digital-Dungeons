/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a minimal self-contained build for Docker deployment
  output: 'standalone',

  // Development proxy to match production Nginx behavior
  async rewrites() {
    // BACKEND_PORT is passed from docker-compose.yml (from backend/.env)
    const backendPort = process.env.BACKEND_PORT || '3013';
    
    return [
      {
        source: '/api/:path*',
        destination: `http://backend:${backendPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
