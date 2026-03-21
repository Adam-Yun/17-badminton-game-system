// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Whitelists your current local IP address so the Next.js hot-reloader can connect
  allowedDevOrigins: ['192.168.1.103'],
};

export default nextConfig;