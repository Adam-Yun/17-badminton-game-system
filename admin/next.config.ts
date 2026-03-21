// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// Import the NextConfig type from Next.js to ensure our configuration object is structured correctly.
// This gives us autocomplete in the editor and catches typos in our config settings.
import type { NextConfig } from 'next';

// Define the configuration object using the imported type.
const nextConfig: NextConfig = {
  // allowedDevOrigins is a security feature in newer Next.js versions.
  // By default, Next.js blocks cross-origin requests to development resources (like the HMR WebSocket) 
  // to prevent malicious sites from connecting to your local server.
  //
  // Adding '10.136.12.196' here explicitly whitelists your specific IP address,
  // allowing your browser on that network to successfully connect to the hot-reloading server.
  allowedDevOrigins: ['192.168.1.103'],
};

// Export the configuration object so the Next.js framework can read it when booting up the server.
export default nextConfig;