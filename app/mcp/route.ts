import { errorResponse, handleMcpRequest, validateMcpRequest } from '@/lib/mcp/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const apiKey = process.env.MCP_API_KEY;
  return !apiKey || request.headers.get('authorization') === `Bearer ${apiKey}`;
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  const configured = process.env.MCP_ALLOWED_ORIGINS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  return origin === new URL(request.url).origin || configured.includes(origin);
}

export async function POST(request: Request): Promise<Response> {
  if (!isAllowedOrigin(request)) {
    return errorResponse(null, { code: -32000, message: 'Forbidden origin' }, 403);
  }
  if (!isAuthorized(request)) {
    return errorResponse(null, { code: -32001, message: 'Unauthorized' }, 401);
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return errorResponse(null, { code: -32700, message: 'Content-Type must be application/json' }, 415);
  }
  const acceptedTypes = request.headers.get('accept')?.toLowerCase() ?? '';
  if (!acceptedTypes.includes('application/json') || !acceptedTypes.includes('text/event-stream')) {
    return errorResponse(null, { code: -32600, message: 'Accept must include application/json and text/event-stream' }, 406);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(null, { code: -32700, message: 'Parse error' });
  }

  const validated = validateMcpRequest(request, body);
  return validated instanceof Response ? validated : handleMcpRequest(validated);
}
