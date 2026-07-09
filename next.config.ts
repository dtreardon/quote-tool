import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium stores its Chromium binary in bin/*.br files that are
  // never statically imported, so @vercel/nft's file tracer misses them.
  // This tells the tracer to explicitly include them for the /api/pdf route.
  outputFileTracingIncludes: {
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
