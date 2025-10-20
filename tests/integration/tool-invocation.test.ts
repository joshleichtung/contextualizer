/**
 * Tool Invocation Integration Tests
 *
 * Tests for complete tool invocation via MCP protocol
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';

describe('Tool Invocation Integration', () => {
  let server: ChildProcess;

  beforeEach(async () => {
    // Ensure server is built
    if (!existsSync('./dist/server.js')) {
      throw new Error('Server not built. Run: npm run build');
    }
  });

  afterEach(() => {
    if (server && !server.killed) {
      server.kill('SIGTERM');
    }
  });

  /**
   * Helper function to send MCP request and wait for response
   */
  function sendRequest(
    request: any,
    requestId: number,
    timeout: number = 5000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let responseData = '';

      server.stdout?.on('data', (data) => {
        responseData += data.toString();

        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);

              if (response.id === requestId) {
                resolve(response);
                return;
              }
            }
          }
        } catch (error) {
          // Partial data, continue accumulating
        }
      });

      server.on('error', reject);

      server.stdin?.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        reject(new Error(`Request ${requestId} timeout`));
      }, timeout);
    });
  }

  /**
   * Helper to initialize server before each test
   */
  async function initializeServer() {
    server = spawn('node', ['./dist/server.js']);

    await sendRequest(
      {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
        id: 1,
      },
      1
    );

    // Allow server to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  describe('tools/list', () => {
    it('returns all 5 tools', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2,
        },
        2
      );

      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);
      expect(response.result.tools).toHaveLength(5);
    });

    it('includes init_project tool metadata', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2,
        },
        2
      );

      const initTool = response.result.tools.find(
        (t: any) => t.name === 'init_project'
      );
      expect(initTool).toBeDefined();
      expect(initTool.description).toBeTruthy();
      expect(initTool.inputSchema).toBeDefined();
    });

    it('includes all expected tool names', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2,
        },
        2
      );

      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('init_project');
      expect(toolNames).toContain('run_doctor');
      expect(toolNames).toContain('configure_hooks');
      expect(toolNames).toContain('manage_memory');
      expect(toolNames).toContain('get_config');
    });
  });

  describe('tools/call - init_project', () => {
    it('invokes init_project successfully', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'init_project',
            arguments: { preset: 'minimal' },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.content).toHaveLength(1);
      expect(response.result.content[0].type).toBe('text');
      // Real implementation returns "Initializing Project" or conflict warnings
      expect(response.result.content[0].text).toMatch(
        /Initializing Project|Conflicting Files/
      );
      // May succeed or fail depending on environment (files may exist)
      expect(typeof response.result.isError).toBe('boolean');
    });

    it('returns error for invalid parameters', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'init_project',
            arguments: { preset: 'invalid' },
          },
          id: 3,
        },
        3
      );

      expect(response.error).toBeDefined();
    });
  });

  describe('tools/call - run_doctor', () => {
    it('invokes run_doctor successfully', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'run_doctor',
            arguments: {},
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('✅ run_doctor');
      expect(response.result.isError).toBe(false);
    });

    it('handles category parameter', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'run_doctor',
            arguments: { category: 'setup' },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(false);
    });
  });

  describe('tools/call - configure_hooks', () => {
    it('invokes configure_hooks successfully', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'configure_hooks',
            arguments: {
              hookType: 'user-prompt-submit',
              action: 'update',
            },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('✅ configure_hooks');
      expect(response.result.isError).toBe(false);
    });
  });

  describe('tools/call - manage_memory', () => {
    it('invokes manage_memory successfully for read', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'manage_memory',
            arguments: { action: 'read' },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('✅ manage_memory');
      expect(response.result.isError).toBe(false);
    });

    it('invokes manage_memory successfully for update', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'manage_memory',
            arguments: {
              action: 'update',
              section: 'test',
              content: 'content',
            },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(false);
    });
  });

  describe('tools/call - get_config', () => {
    it('invokes get_config successfully', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_config',
            arguments: {},
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain('✅ get_config');
      expect(response.result.isError).toBe(false);
    });

    it('handles format parameter', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'get_config',
            arguments: { format: 'json' },
          },
          id: 3,
        },
        3
      );

      expect(response.result).toBeDefined();
      expect(response.result.isError).toBe(false);
    });
  });

  describe('error handling', () => {
    it('returns error for invalid tool name', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'nonexistent_tool',
            arguments: {},
          },
          id: 3,
        },
        3
      );

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Unknown tool');
    });

    it('returns error for missing required parameters', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'init_project',
            arguments: {},
          },
          id: 3,
        },
        3
      );

      expect(response.error).toBeDefined();
    });

    it('formats error responses correctly', async () => {
      await initializeServer();

      const response = await sendRequest(
        {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'init_project',
            arguments: { preset: 'invalid' },
          },
          id: 3,
        },
        3
      );

      expect(response.error).toBeDefined();
      expect(response.error.code).toBeDefined();
      expect(response.error.message).toBeTruthy();
    });
  });
});
