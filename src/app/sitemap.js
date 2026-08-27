export default function sitemap() {
  const base = 'https://partylens.fr';
  const paths = ['/', '/avis', '/contact', '/legal', '/login', '/register'];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.5,
  }));
}
