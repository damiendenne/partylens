export default function sitemap() {
  const base = 'https://www.partylens.fr';
  const paths = ['/', '/avis', '/contact', '/legal'];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.5,
  }));
}
