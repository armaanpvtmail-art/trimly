/**
 * Sitemap generator for Trimly.
 * Dynamically generates sitemap.xml from published links and static pages.
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://trimly.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = new URL(DOMAIN);
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl.toString(),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: new URL('/login', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: new URL('/register', baseUrl).toString(),
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ];

  try {
    // Fetch all published (enabled) short links.
    const links = await prisma.shortLink.findMany({
      where: { isEnabled: true },
      select: { slug: true, updatedAt: true },
      take: 50000, // Sitemap limit per file.
    });

    // Add each link to sitemap (public redirect page).
    links.forEach((link) => {
      entries.push({
        url: new URL(`/${link.slug}`, baseUrl).toString(),
        lastModified: link.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
  }

  return entries;
}
