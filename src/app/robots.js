export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/super-admin', '/api', '/login', '/register'] }],
    sitemap: 'https://partylens.fr/sitemap.xml',
  };
}
