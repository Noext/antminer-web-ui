import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
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
}
