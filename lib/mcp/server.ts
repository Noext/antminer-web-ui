import { formatMinerSummary, getMinerGraphData, getMinerLiveInfo } from '@/lib/miner-live-data';
import {
  MCP_APP_MIME_TYPE,
  MINER_GRAPHS_APP_HTML,
  MINER_GRAPHS_RESOURCE_URI,
} from './miner-graphs-app';

export const MCP_PROTOCOL_VERSION = '2026-07-28';
export const LEGACY_MCP_PROTOCOL_VERSION = '2025-11-25';
export const LEGACY_MCP_PROTOCOL_VERSIONS = [
  '2025-03-26',
  '2025-06-18',
  LEGACY_MCP_PROTOCOL_VERSION,
] as const;

type RequestId = string | number;
type JsonObject = Record<string, unknown>;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: RequestId;
  method: string;
  params: JsonObject;
  era: 'modern' | 'legacy';
  protocolVersion: string;
}

interface McpError {
  code: number;
  message: string;
  data?: unknown;
}

const EMPTY_INPUT_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

const LIVE_OUTPUT_SCHEMA = {
  type: 'object',
  required: ['collectedAt', 'miner', 'uptimeSeconds', 'health', 'hashrate', 'temperatures', 'fans', 'hashboards', 'activePool'],
  additionalProperties: false,
  properties: {
    collectedAt: { type: 'string', format: 'date-time' },
    miner: { type: 'object' },
    uptimeSeconds: { type: 'number' },
    health: { type: 'object' },
    hashrate: { type: 'object' },
    temperatures: { type: 'object' },
    fans: { type: 'array' },
    hashboards: { type: 'array' },
    activePool: { type: ['object', 'null'] },
  },
} as const;

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function requestMeta(request: JsonRpcRequest): JsonObject | null {
  return asObject(request.params._meta);
}

function supportsMcpApps(request: JsonRpcRequest): boolean {
  if (request.era === 'legacy') return true;

  const meta = requestMeta(request);
  const capabilities = asObject(meta?.['io.modelcontextprotocol/clientCapabilities']);
  const extensions = asObject(capabilities?.extensions);
  const ui = asObject(extensions?.['io.modelcontextprotocol/ui']);
  return Array.isArray(ui?.mimeTypes) && ui.mimeTypes.includes(MCP_APP_MIME_TYPE);
}

function tools(includeUi: boolean) {
  return [
    {
      name: 'get_miner_live_info',
      title: 'Live Antminer information',
      description: 'Returns current, read-only Antminer mining data: health, hashrate, temperatures, fans, hashboards, uptime and active pool.',
      inputSchema: EMPTY_INPUT_SCHEMA,
      outputSchema: LIVE_OUTPUT_SCHEMA,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    {
      name: 'show_miner_graphs',
      title: 'Antminer live graphs',
      description: 'Returns current Antminer metrics and per-hashboard hashrate history. MCP Apps hosts render the result as interactive graphs; other hosts receive a useful text fallback.',
      inputSchema: EMPTY_INPUT_SCHEMA,
      outputSchema: {
        ...LIVE_OUTPUT_SCHEMA,
        required: [...LIVE_OUTPUT_SCHEMA.required, 'hashrateHistory'],
        properties: {
          ...LIVE_OUTPUT_SCHEMA.properties,
          hashrateHistory: { type: 'object' },
        },
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      ...(includeUi
        ? {
            _meta: {
              ui: {
                resourceUri: MINER_GRAPHS_RESOURCE_URI,
                visibility: ['model', 'app'],
              },
            },
          }
        : {}),
    },
  ];
}

function result(id: RequestId, value: unknown): Response {
  return Response.json({ jsonrpc: '2.0', id, result: value });
}

function protocolResult(request: JsonRpcRequest, value: JsonObject): Response {
  if (request.era === 'modern') return result(request.id, value);

  const legacyValue = { ...value };
  delete legacyValue.resultType;
  delete legacyValue.ttlMs;
  delete legacyValue.cacheScope;
  return result(request.id, legacyValue);
}

export function errorResponse(id: RequestId | null, error: McpError, status = 400): Response {
  return Response.json({ jsonrpc: '2.0', id, error }, { status });
}

export function validateMcpRequest(request: Request, body: unknown): JsonRpcRequest | Response {
  const parsed = asObject(body);
  const params = parsed?.params === undefined ? {} : asObject(parsed.params);
  const id = typeof parsed?.id === 'string' || typeof parsed?.id === 'number' ? parsed.id : null;

  if (parsed?.jsonrpc !== '2.0' || id === null || typeof parsed.method !== 'string' || !params) {
    return errorResponse(id, { code: -32600, message: 'Invalid Request' });
  }

  const rpcRequest: JsonRpcRequest = {
    jsonrpc: '2.0',
    id,
    method: parsed.method,
    params,
    era: 'modern',
    protocolVersion: MCP_PROTOCOL_VERSION,
  };
  const meta = requestMeta(rpcRequest);
  const bodyVersion = meta?.['io.modelcontextprotocol/protocolVersion'];
  const clientInfo = asObject(meta?.['io.modelcontextprotocol/clientInfo']);
  const clientCapabilities = asObject(meta?.['io.modelcontextprotocol/clientCapabilities']);
  const headerVersion = request.headers.get('MCP-Protocol-Version');
  const headerMethod = request.headers.get('Mcp-Method');
  const legacyVersion = rpcRequest.method === 'initialize'
    ? rpcRequest.params.protocolVersion
    : headerVersion;

  const supportsLegacyVersion = typeof legacyVersion === 'string'
    && LEGACY_MCP_PROTOCOL_VERSIONS.some((version) => version === legacyVersion);

  if (rpcRequest.method === 'initialize' || supportsLegacyVersion || (bodyVersion === undefined && headerVersion === null)) {
    if (rpcRequest.method === 'initialize' && !supportsLegacyVersion) {
      return errorResponse(id, {
        code: -32602,
        message: 'Unsupported legacy protocol version',
        data: {
          supportedVersions: [MCP_PROTOCOL_VERSION, ...LEGACY_MCP_PROTOCOL_VERSIONS],
          requestedVersion: legacyVersion ?? null,
        },
      });
    }
    rpcRequest.era = 'legacy';
    rpcRequest.protocolVersion = supportsLegacyVersion
      ? legacyVersion
      : LEGACY_MCP_PROTOCOL_VERSION;
    return rpcRequest;
  }

  if (headerVersion !== bodyVersion || headerMethod !== rpcRequest.method) {
    return errorResponse(id, { code: -32020, message: 'Header mismatch: MCP transport headers do not match the JSON-RPC body' });
  }
  if (bodyVersion !== MCP_PROTOCOL_VERSION) {
    return errorResponse(
      id,
      {
        code: -32022,
        message: 'Unsupported protocol version',
        data: {
          supportedVersions: [MCP_PROTOCOL_VERSION, ...LEGACY_MCP_PROTOCOL_VERSIONS],
          requestedVersion: bodyVersion ?? null,
        },
      },
    );
  }
  if (typeof clientInfo?.name !== 'string' || typeof clientInfo.version !== 'string' || !clientCapabilities) {
    return errorResponse(id, { code: -32602, message: 'Missing required MCP client metadata' });
  }

  if (rpcRequest.method === 'tools/call' || rpcRequest.method === 'resources/read') {
    const name = rpcRequest.method === 'tools/call' ? params.name : params.uri;
    if (typeof name !== 'string' || request.headers.get('Mcp-Name') !== name) {
      return errorResponse(id, { code: -32020, message: 'Header mismatch: Mcp-Name does not match the JSON-RPC body' });
    }
  }

  return rpcRequest;
}

export async function handleMcpRequest(request: JsonRpcRequest): Promise<Response> {
  switch (request.method) {
    case 'initialize':
      return result(request.id, {
        protocolVersion: request.protocolVersion,
        capabilities: {
          tools: {},
          resources: {},
          extensions: {
            'io.modelcontextprotocol/ui': { mimeTypes: [MCP_APP_MIME_TYPE] },
          },
        },
        serverInfo: {
          name: 'antminer-web-ui',
          version: '1.1.0',
        },
        instructions: 'Use get_miner_live_info for concise live telemetry and show_miner_graphs when visual history is useful. Both tools are read-only.',
      });

    case 'ping':
      return result(request.id, {});

    case 'server/discover':
      return result(request.id, {
        resultType: 'complete',
        supportedVersions: [MCP_PROTOCOL_VERSION, ...LEGACY_MCP_PROTOCOL_VERSIONS],
        capabilities: {
          tools: {},
          resources: {},
          extensions: {
            'io.modelcontextprotocol/ui': { mimeTypes: [MCP_APP_MIME_TYPE] },
          },
        },
        _meta: {
          'io.modelcontextprotocol/serverInfo': {
            name: 'antminer-web-ui',
            version: '1.1.0',
          },
        },
        instructions: 'Use get_miner_live_info for concise live telemetry and show_miner_graphs when visual history is useful. Both tools are read-only.',
        ttlMs: 300_000,
        cacheScope: 'public',
      });

    case 'tools/list':
      return protocolResult(request, {
        resultType: 'complete',
        tools: tools(supportsMcpApps(request)),
        ttlMs: 300_000,
        cacheScope: 'private',
      });

    case 'resources/list':
      return protocolResult(request, {
        resultType: 'complete',
        resources: supportsMcpApps(request)
          ? [{
              uri: MINER_GRAPHS_RESOURCE_URI,
              name: 'antminer_miner_graphs',
              title: 'Antminer live graphs',
              description: 'Sandboxed MCP App for hashrate, hashboard temperature and fan graphs.',
              mimeType: MCP_APP_MIME_TYPE,
            }]
          : [],
        ttlMs: 3_600_000,
        cacheScope: 'private',
      });

    case 'resources/read':
      if (request.params.uri !== MINER_GRAPHS_RESOURCE_URI) {
        return errorResponse(request.id, { code: -32002, message: 'Resource not found' }, 404);
      }
      return protocolResult(request, {
        resultType: 'complete',
        contents: [{
          uri: MINER_GRAPHS_RESOURCE_URI,
          mimeType: MCP_APP_MIME_TYPE,
          text: MINER_GRAPHS_APP_HTML,
          _meta: {
            ui: {
              csp: {
                connectDomains: [],
                resourceDomains: [],
                frameDomains: [],
                baseUriDomains: [],
              },
              prefersBorder: true,
            },
          },
        }],
        ttlMs: 3_600_000,
        cacheScope: 'public',
      });

    case 'tools/call': {
      const name = request.params.name;
      if (name !== 'get_miner_live_info' && name !== 'show_miner_graphs') {
        return errorResponse(request.id, { code: -32602, message: `Unknown tool: ${String(name)}` });
      }

      try {
        const data = name === 'get_miner_live_info'
          ? await getMinerLiveInfo()
          : await getMinerGraphData();
        return protocolResult(request, {
          resultType: 'complete',
          content: [{ type: 'text', text: formatMinerSummary(data) }],
          structuredContent: data,
          isError: false,
        });
      } catch (error) {
        console.error('[MCP] Antminer tool failed:', error);
        return protocolResult(request, {
          resultType: 'complete',
          content: [{ type: 'text', text: 'Impossible de récupérer les données du mineur pour le moment.' }],
          isError: true,
        });
      }
    }

    default:
      return errorResponse(request.id, { code: -32601, message: 'Method not found' }, 404);
  }
}
