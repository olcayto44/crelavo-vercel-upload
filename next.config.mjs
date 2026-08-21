/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Robots-Tag", value: "index, follow" }
];

const privateRouteHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store" }
];

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: [] }
  },
  async redirects() {
    return [
      { source: "/categories-Categories", destination: "/categories", permanent: true },
      { source: "/live-sales-credits-v2", destination: "/live-sales-credits", permanent: true },
      { source: "/alternatives/crelavo-vs-creatify", destination: "/alternatives/creatify-alternative", permanent: true }
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/admin/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/dashboard/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/api/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/auth/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/checkout/complete",
        headers: privateRouteHeaders
      },
      {
        source: "/checkout/complete/:path*",
        headers: privateRouteHeaders
      },
      {
        source: "/checkout/whop",
        headers: privateRouteHeaders
      },
      {
        source: "/checkout/whop/:path*",
        headers: privateRouteHeaders
      }
    ];
  }
};

export default nextConfig;
