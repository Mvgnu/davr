/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Explicitly set the app directory as the only source of routes
  useFileSystemPublicRoutes: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Add webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs', 'net', 'tls' and other Node.js-specific modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        pg: false,
      };
    }
    return config;
  },
}

export default nextConfig; 