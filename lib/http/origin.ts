function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

function normalizedOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isRequestOriginAllowed(
  headers: Headers,
  fallbackOrigin: string,
  configuredOrigin = process.env.APP_ORIGIN,
): boolean {
  const requestOrigin = headers.get('origin');
  if (!requestOrigin) return true;

  const normalizedRequestOrigin = normalizedOrigin(requestOrigin);
  if (!normalizedRequestOrigin) return false;

  if (configuredOrigin) {
    return normalizedRequestOrigin === normalizedOrigin(configuredOrigin);
  }

  const forwardedHost = firstHeaderValue(headers.get('x-forwarded-host'));
  const host = forwardedHost || headers.get('host');
  const forwardedProtocol = firstHeaderValue(headers.get('x-forwarded-proto'));
  const fallback = new URL(fallbackOrigin);
  const protocol = forwardedProtocol || fallback.protocol.replace(':', '');
  const expectedOrigin = host ? `${protocol}://${host}` : fallback.origin;

  return normalizedRequestOrigin === normalizedOrigin(expectedOrigin);
}
