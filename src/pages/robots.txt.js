import settings from '../data/settings.json';

export async function GET({ site }) {
  const disallowPaths = settings.seo?.disallowPaths || [];
  const baseUrl = site?.toString().replace(/\/$/, '') ?? 'https://ciensite.mx';

  const lines = [
    'User-agent: *',
    ...(disallowPaths.length > 0
      ? disallowPaths.map((p) => `Disallow: ${p}`)
      : ['Allow: /']),
    '',
    `Sitemap: ${baseUrl}/sitemap-index.xml`,
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
