import nextBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add other Next.js configurations here if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**', // Allows any path under this bucket
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ENV: 'PRODUCTION',
  },
  webpack: (config, { isServer }) => {
    // Exclude 'net' from the client-side bundle
    if (!isServer) {
      config.resolve.fallback.net = false;
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
