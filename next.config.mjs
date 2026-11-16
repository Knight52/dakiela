/** @type {import('next').NextConfig} */
import {createMDX} from "fumadocs-mdx/next"
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
  },
  images:{
    remotePatterns: [new URL("https://ao4cowzhmgwkktn4.public.blob.vercel-storage.com/**")]
  }
};

export default createMDX()(nextConfig);