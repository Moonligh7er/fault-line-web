import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.faultline.app';
  const now = new Date();
  return [
    { url: origin, lastModified: now, priority: 1.0 },
    { url: `${origin}/map`, lastModified: now, priority: 0.9 },
    { url: `${origin}/about`, lastModified: now, priority: 0.7 },
    { url: `${origin}/privacy`, lastModified: now, priority: 0.5 },
    { url: `${origin}/terms`, lastModified: now, priority: 0.5 },
  ];
}
