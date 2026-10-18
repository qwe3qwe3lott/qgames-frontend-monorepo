import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Только статика: HTML собирается при сборке в out/ (CLAUDE.md §1).
  output: 'export',
  images: {unoptimized: true},
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['@qgames/ui'],
};

export default nextConfig;
