// Wire Cloudflare bindings (D1, R2) into `next dev` so API routes can
// read `getRequestContext().env.DB` etc. without deploying. This only
// runs in development; production builds go through `next-on-pages`,
// which provides bindings naturally.
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = await import(
    "@cloudflare/next-on-pages/next-dev"
  );
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
