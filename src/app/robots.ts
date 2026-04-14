import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.faultline.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/auth/', '/submit', '/profile', '/dashboard'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
