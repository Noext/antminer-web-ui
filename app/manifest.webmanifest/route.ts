import type { MetadataRoute } from 'next';

const manifest: MetadataRoute.Manifest = {
  name: 'Antminer Dashboard',
  short_name: 'Antminer',
  description: 'Surveillance en temps réel de votre Antminer',
  start_url: '/',
  display: 'standalone',
  background_color: '#0f172a',
  theme_color: '#06b6d4',
  icons: [
    {
      src: '/icons/antminer-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/antminer-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/antminer-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

export function GET() {
  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, must-revalidate',
    },
  });
}
