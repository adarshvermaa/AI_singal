import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://alphx.trade',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];
}
