
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // Enable standalone output mode
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Add the allowedDevOrigins configuration here
    allowedDevOrigins: ['http://3000-firebase-studio-1749530652959.cluster-isls3qj2gbd5qs4jkjqvhahfv6.cloudworkstations.dev'],
  },
};

export default nextConfig;
