/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io']
  },
  output: 'standalone',
  outputFileTracing: true,
  experimental: {
    outputFileTracingRoot: undefined,
  }
};

module.exports = nextConfig;