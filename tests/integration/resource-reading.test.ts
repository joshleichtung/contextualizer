/**
 * Integration tests for resource reading through MCP protocol
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

describe('Resource Reading Integration', () => {
  let server: ChildProcess;
  let responseBuffer: string = '';

  beforeAll(async () => {
    // Start the MCP server
    server = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Give server time to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  /**
   * Helper to send request and get response
   */
  async function sendRequest(method: string, params?: any): Promise<any> {
    const id = Date.now();
    const request = {
      jsonrpc: '2.0',
      method,
      ...(params && { params }),
      id,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const onData = (data: Buffer) => {
        responseBuffer += data.toString();
        const lines = responseBuffer.split('\n');
        responseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === id) {
                clearTimeout(timeout);
                server.stdout?.off('data', onData);
                resolve(response);
              }
            } catch (e) {
              // Ignore parse errors for partial data
            }
          }
        }
      };

      server.stdout?.on('data', onData);
      server.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  describe('resources/list', () => {
    it('returns all 3 resources', async () => {
      const response = await sendRequest('resources/list');

      expect(response.result).toBeDefined();
      expect(response.result.resources).toBeDefined();
      expect(response.result.resources).toHaveLength(3);
    });

    it('includes config resource', async () => {
      const response = await sendRequest('resources/list');
      const uris = response.result.resources.map((r: any) => r.uri);
      expect(uris).toContain('contextualizer://config');
    });

    it('includes diagnostics resource', async () => {
      const response = await sendRequest('resources/list');
      const uris = response.result.resources.map((r: any) => r.uri);
      expect(uris).toContain('contextualizer://diagnostics');
    });

    it('includes presets resource', async () => {
      const response = await sendRequest('resources/list');
      const uris = response.result.resources.map((r: any) => r.uri);
      expect(uris).toContain('contextualizer://presets');
    });

    it('includes correct metadata for each resource', async () => {
      const response = await sendRequest('resources/list');
      response.result.resources.forEach((resource: any) => {
        expect(resource.uri).toBeTruthy();
        expect(resource.name).toBeTruthy();
        expect(resource.description).toBeTruthy();
        expect(resource.mimeType).toBeTruthy();
      });
    });

    it('config resource has YAML MIME type', async () => {
      const response = await sendRequest('resources/list');
      const configResource = response.result.resources.find(
        (r: any) => r.uri === 'contextualizer://config',
      );
      expect(configResource.mimeType).toBe('application/x-yaml');
    });

    it('diagnostics resource has JSON MIME type', async () => {
      const response = await sendRequest('resources/list');
      const diagResource = response.result.resources.find(
        (r: any) => r.uri === 'contextualizer://diagnostics',
      );
      expect(diagResource.mimeType).toBe('application/json');
    });

    it('presets resource has JSON MIME type', async () => {
      const response = await sendRequest('resources/list');
      const presetsResource = response.result.resources.find(
        (r: any) => r.uri === 'contextualizer://presets',
      );
      expect(presetsResource.mimeType).toBe('application/json');
    });
  });

  describe('resources/read - config', () => {
    it('reads config resource successfully', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://config',
      });

      expect(response.result).toBeDefined();
      expect(response.result.contents).toBeDefined();
      expect(response.result.contents).toHaveLength(1);
      expect(response.result.contents[0].uri).toBe('contextualizer://config');
    });

    it('returns YAML MIME type', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://config',
      });
      expect(response.result.contents[0].mimeType).toBe('application/x-yaml');
    });

    it('returns text content', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://config',
      });
      expect(response.result.contents[0].text).toBeTruthy();
    });

    it('content includes version field', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://config',
      });
      expect(response.result.contents[0].text).toContain('version:');
    });

    it('content includes preset field', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://config',
      });
      expect(response.result.contents[0].text).toContain('preset:');
    });
  });

  describe('resources/read - diagnostics', () => {
    it('reads diagnostics resource successfully', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });

      expect(response.result).toBeDefined();
      expect(response.result.contents).toBeDefined();
      expect(response.result.contents).toHaveLength(1);
      expect(response.result.contents[0].uri).toBe(
        'contextualizer://diagnostics',
      );
    });

    it('returns JSON MIME type', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });
      expect(response.result.contents[0].mimeType).toBe('application/json');
    });

    it('returns valid JSON content', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed).toBeDefined();
    });

    it('content includes timestamp', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed.timestamp).toBeDefined();
    });

    it('content includes summary', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed.summary).toBeDefined();
    });

    it('content includes checks array', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://diagnostics',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed.checks).toBeDefined();
      expect(Array.isArray(parsed.checks)).toBe(true);
    });
  });

  describe('resources/read - presets', () => {
    it('reads presets resource successfully', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });

      expect(response.result).toBeDefined();
      expect(response.result.contents).toBeDefined();
      expect(response.result.contents).toHaveLength(1);
      expect(response.result.contents[0].uri).toBe('contextualizer://presets');
    });

    it('returns JSON MIME type', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      expect(response.result.contents[0].mimeType).toBe('application/json');
    });

    it('returns valid JSON content', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed).toBeDefined();
    });

    it('content includes 3 presets', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      expect(parsed.presets).toHaveLength(3);
    });

    it('includes minimal preset', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('minimal');
    });

    it('includes web-fullstack preset', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('web-fullstack');
    });

    it('includes hackathon preset', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('hackathon');
    });

    it('each preset has required fields', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://presets',
      });
      const parsed = JSON.parse(response.result.contents[0].text);
      parsed.presets.forEach((preset: any) => {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.contextMonitoring).toBeDefined();
      });
    });
  });

  describe('resources/read - error handling', () => {
    it('returns error for invalid URI', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'contextualizer://invalid',
      });

      expect(response.error).toBeDefined();
    });

    it('returns error for malformed URI', async () => {
      const response = await sendRequest('resources/read', {
        uri: 'invalid-uri',
      });

      expect(response.error).toBeDefined();
    });
  });
});
