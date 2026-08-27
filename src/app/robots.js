export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/super-admin', '/api', '/login', '/register'] }],
    sitemap: 'https://www.partylens.fr/sitemap.xml',
  };
}
