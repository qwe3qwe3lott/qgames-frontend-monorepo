import type {NextConfig} from 'next';
import withRspack from 'next-rspack';

const nextConfig: NextConfig = {
  // Только статика: HTML собирается при сборке в out/ (CLAUDE.md §1).
  output: 'export',
  images: {unoptimized: true},
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['@qgames/ui'],
};

export default withRspack(nextConfig);
