import { describe, expect, test } from 'bun:test';
import { isRequestOriginAllowed } from './origin';

describe('isRequestOriginAllowed', () => {
  test('accepte l’origine publique explicitement configurée', () => {
    const headers = new Headers({ origin: 'https://antminer.noext.fr' });
    expect(isRequestOriginAllowed(headers, 'http://127.0.0.1:3000', 'https://antminer.noext.fr')).toBe(true);
  });

  test('refuse une autre origine', () => {
    const headers = new Headers({ origin: 'https://example.com' });
    expect(isRequestOriginAllowed(headers, 'http://127.0.0.1:3000', 'https://antminer.noext.fr')).toBe(false);
  });

  test('utilise les en-têtes du reverse proxy sans configuration explicite', () => {
    const headers = new Headers({
      origin: 'https://antminer.noext.fr',
      host: '127.0.0.1:3000',
      'x-forwarded-host': 'antminer.noext.fr',
      'x-forwarded-proto': 'https',
    });
    expect(isRequestOriginAllowed(headers, 'http://127.0.0.1:3000', '')).toBe(true);
  });
});
