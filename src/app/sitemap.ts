import { MetadataRoute } from 'next';

/**
 * Generates a sitemap.xml file for the application.
 * This helps search engines find and index your pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Updated to your official production domain
  const baseUrl = 'https://rhobile.com';

  // Define your main static routes
  const routes = [
    '',
    '/news',
    '/observations',
    '/about',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return [...routes];
}
