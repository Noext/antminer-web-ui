import crypto from 'crypto';

interface DigestAuthParams {
  username: string;
  password: string;
  method: string;
  uri: string;
  realm?: string;
  nonce?: string;
  qop?: string;
  nc?: string;
  cnonce?: string;
}

/**
 * Generates MD5 hash
 */
function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Generates a random cnonce for Digest authentication
 */
export function generateCnonce(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Parses the WWW-Authenticate header to extract Digest auth parameters
 */
export function parseWWWAuthenticate(header: string): {
  realm?: string;
  nonce?: string;
  qop?: string;
  opaque?: string;
  algorithm?: string;
} {
  const params: Record<string, string> = {};
  
  // Remove "Digest " prefix
  const authHeader = header.replace(/^Digest\s+/i, '');
  
  // Parse key-value pairs with better regex
  const regex = /(\w+)=(?:"([^"]+)"|([^\s,]+))/g;
  let match;
  
  while ((match = regex.exec(authHeader)) !== null) {
    const key = match[1];
    const value = match[2] || match[3]; // quoted or unquoted value
    params[key] = value;
  }
  
  return params;
}

/**
 * Generates the Digest Authorization header
 */
export function generateDigestAuthHeader(params: DigestAuthParams & { opaque?: string }): string {
  const {
    username,
    password,
    method,
    uri,
    realm = '',
    nonce = '',
    qop = 'auth',
    nc = '00000001',
    cnonce = generateCnonce(),
    opaque,
  } = params;

  // Calculate HA1 = MD5(username:realm:password)
  const ha1 = md5(`${username}:${realm}:${password}`);

  // Calculate HA2 = MD5(method:uri)
  const ha2 = md5(`${method}:${uri}`);

  // Calculate response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
  const responseInput = `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`;
  const response = md5(responseInput);

  // Build authorization header parts
  const authParts = [
    `Digest username="${username}"`,
    `realm="${realm}"`,
    `nonce="${nonce}"`,
    `uri="${uri}"`,
    `response="${response}"`,
  ];

  // Add optional parts
  if (qop) {
    authParts.push(`qop=${qop}`);
    authParts.push(`nc=${nc}`);
    authParts.push(`cnonce="${cnonce}"`);
  }

  if (opaque) {
    authParts.push(`opaque="${opaque}"`);
  }

  const authHeader = authParts.join(', ');

  return authHeader;
}

/**
 * Makes an authenticated request to the Antminer API with Digest authentication
 */
export async function authenticatedFetch(
  url: string,
  username: string,
  password: string,
  options: RequestInit = {}
): Promise<Response> {
  // First request to get the authentication challenge
  const initialResponse = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  // If 401, parse WWW-Authenticate header and retry with credentials
  if (initialResponse.status === 401) {
    const wwwAuth = initialResponse.headers.get('WWW-Authenticate');
    
    if (!wwwAuth) {
      throw new Error('No WWW-Authenticate header found');
    }

    const authParams = parseWWWAuthenticate(wwwAuth);
    const urlObj = new URL(url);
    const uri = urlObj.pathname + (urlObj.search || '');
    
    const authHeader = generateDigestAuthHeader({
      username,
      password,
      method: options.method || 'GET',
      uri,
      realm: authParams.realm,
      nonce: authParams.nonce,
      qop: authParams.qop,
      opaque: authParams.opaque,
    });

    // Retry request with authentication
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: authHeader,
      },
    });
  }

  return initialResponse;
}

