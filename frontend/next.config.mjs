/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone output for Docker builds (not dev mode)
  output: process.env.DOCKER_OUTPUT === 'true' ? 'standalone' : undefined,
  eslint: {
    // Allow builds to proceed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to proceed even with TypeScript errors
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
