/**
 * robots.txt generator for Trimly.
 */

import { MetadataRoute } from 'next';

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://trimly.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/create',
          '/links',
          '/analytics',
          '/profile',
          '/subscribe',
          '/api',
          '/payment',
        ],
      },
      {
        userAgent: 'AdsBot-Google',
        allow: '/',
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
  };
}
