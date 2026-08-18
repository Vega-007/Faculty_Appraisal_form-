/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { message: /PackFileCacheStrategy/ },
        { message: /Serializing big strings/ },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
