/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  rewrites ()
  {
    return [{
      source: '/interactions',
      destination: '/api/discord',
    }]
  }
};

export default nextConfig;