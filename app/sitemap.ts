import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://techupkeep.dev';
  const currentDate = new Date();

  return [
    // Homepage - highest priority, updated daily
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Blog index - high priority
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Blog posts - important for SEO
    {
      url: `${baseUrl}/blog/github-trending-discover-new-tools`,
      lastModified: new Date('2025-10-21'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/how-to-stay-updated-as-junior-software-engineer`,
      lastModified: new Date('2025-10-18'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/best-tech-newsletters-for-junior-developers`,
      lastModified: new Date('2025-10-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
