/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  // Explicitly set the app directory as the only source of routes
  useFileSystemPublicRoutes: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

module.exports = nextConfig 