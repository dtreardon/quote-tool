import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium stores its Chromium binary in bin/*.br files that are
  // never statically imported, so @vercel/nft's file tracer misses them.
  // This tells the tracer to explicitly include them for the /api/pdf route.
  outputFileTracingIncludes: {
    // lib/fonts holds Liberation Sans, read with fs and injected into invoice pages.
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**', './lib/fonts/**'],
  },
};

export default nextConfig;
