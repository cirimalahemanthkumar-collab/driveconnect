/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@driveconnect/shared"],
  env: {
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? "http://localhost:5000"
  }
};

export default nextConfig;
