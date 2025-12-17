/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the embed script to be served from public directory
  async headers() {
    return [
      {
        source: '/popup.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

