import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import settings from '../data/settings.json';

export async function GET(context) {
  const articles = (await getCollection('articulos'))
    .filter((a) => !a.data.draft)
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const siteName = settings.siteName || 'Ciensite';
  const description = settings.seo?.defaultDescription || `Artículos de ${siteName}`;

  return rss({
    title: siteName,
    description,
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: new Date(a.data.date),
      description: a.data.description,
      link: `/articulos/${a.id}/`,
      categories: [a.data.category, ...(a.data.tags || [])],
    })),
    customData: '<language>es-mx</language>',
  });
}
