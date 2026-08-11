import { describe, expect, test } from 'bun:test';
import { handleMcpRequest, MCP_PROTOCOL_VERSION, validateMcpRequest } from './server';

const clientMeta = {
  'io.modelcontextprotocol/protocolVersion': MCP_PROTOCOL_VERSION,
  'io.modelcontextprotocol/clientInfo': { name: 'test-client', version: '1.0.0' },
  'io.modelcontextprotocol/clientCapabilities': {
    extensions: {
      'io.modelcontextprotocol/ui': {
        mimeTypes: ['text/html;profile=mcp-app'],
      },
    },
  },
};

function request(method: string, name?: string): Request {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    'Mcp-Method': method,
  };
  if (name) headers['Mcp-Name'] = name;
  return new Request('http://localhost/mcp', { method: 'POST', headers });
}

function body(method: string, params: Record<string, unknown> = {}) {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params: { ...params, _meta: clientMeta },
  };
}

describe('MCP 2026-07-28 server', () => {
  test('discovers tools, resources and the MCP Apps extension', async () => {
    const validated = validateMcpRequest(request('server/discover'), body('server/discover'));
    expect(validated).not.toBeInstanceOf(Response);
    const response = await handleMcpRequest(validated as never);
    const payload = await response.json();

    expect(payload.result.supportedVersions).toEqual([MCP_PROTOCOL_VERSION]);
    expect(payload.result.capabilities.extensions['io.modelcontextprotocol/ui'].mimeTypes)
      .toContain('text/html;profile=mcp-app');
  });

  test('links the graph tool to its ui resource for capable hosts', async () => {
    const validated = validateMcpRequest(request('tools/list'), body('tools/list'));
    const response = await handleMcpRequest(validated as never);
    const payload = await response.json();
    const graphTool = payload.result.tools.find((tool: { name: string }) => tool.name === 'show_miner_graphs');

    expect(graphTool._meta.ui.resourceUri).toBe('ui://antminer/miner-graphs.html');
  });

  test('returns a self-contained MCP App HTML resource', async () => {
    const uri = 'ui://antminer/miner-graphs.html';
    const validated = validateMcpRequest(
      request('resources/read', uri),
      body('resources/read', { uri }),
    );
    const response = await handleMcpRequest(validated as never);
    const payload = await response.json();

    expect(payload.result.contents[0].mimeType).toBe('text/html;profile=mcp-app');
    expect(payload.result.contents[0].text).toContain('ui/notifications/tool-result');
    const script = payload.result.contents[0].text.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(() => new Function(script as string)).not.toThrow();
  });

  test('rejects mismatched transport headers', async () => {
    const invalidRequest = request('tools/list');
    const validated = validateMcpRequest(invalidRequest, body('server/discover'));

    expect(validated).toBeInstanceOf(Response);
    const payload = await (validated as Response).json();
    expect(payload.error.code).toBe(-32020);
  });
});
