/** @type {import('next').NextConfig} */
const nextConfig = {
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
