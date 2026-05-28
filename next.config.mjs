/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/wine-price-website',
  assetPrefix: '/wine-price-website',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
