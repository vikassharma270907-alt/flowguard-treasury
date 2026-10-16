/**
 * Next.js Configuration
 * Specifies headers for static PDF guide delivery with cache control, inline disposition, and noindex robots tag.
 * 
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/docs/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/pdf'
          },
          {
            key: 'Content-Disposition',
            value: 'inline'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
