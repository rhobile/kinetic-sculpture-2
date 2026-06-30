import type { MetadataRoute } from 'next';

/**
 * Generates a robots.txt file for the application.
 * This helps search engines understand which parts of the site to index.
 */
export default function robots(): MetadataRoute.Robots {
  // Updated to your official production domain
  const baseUrl = 'https://rhobile.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/manage', '/manage/'], // Keep the admin dashboard out of search results
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
