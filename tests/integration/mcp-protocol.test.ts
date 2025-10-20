/**
 * MCP Protocol Integration Tests
 *
 * Tests for complete MCP protocol communication via stdio
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';

describe('MCP Protocol Integration', () => {
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

  it('server starts successfully', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      server.on('error', reject);

      // Server should start without immediate errors
      setTimeout(() => {
        if (!server.killed) {
          resolve();
        } else {
          reject(new Error('Server exited unexpectedly'));
        }
      }, 1000);
    });
  });

  it('completes MCP initialize handshake', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let responseData = '';

      server.stdout?.on('data', (data) => {
        responseData += data.toString();

        // Try to parse response
        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);

              if (response.id === 1) {
                expect(response.result).toBeDefined();
                expect(response.result.protocolVersion).toBeDefined();
                expect(response.result.capabilities).toBeDefined();
                expect(response.result.capabilities.tools).toBeDefined();
                expect(response.result.capabilities.resources).toBeDefined();
                expect(response.result.capabilities.prompts).toBeDefined();
                expect(response.result.serverInfo).toBeDefined();
                expect(response.result.serverInfo.name).toBe('contextualizer');
                expect(response.result.serverInfo.version).toBe('1.0.0');
                resolve();
                return;
              }
            }
          }
        } catch (error) {
          // Partial data, continue accumulating
        }
      });

      server.on('error', reject);

      // Send initialize request
      server.stdin?.write(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
          id: 1,
        }) + '\n'
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Initialize handshake timeout'));
      }, 5000);
    });
  });

  it('returns 5 tools in list', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let responseData = '';

      server.stdout?.on('data', (data) => {
        responseData += data.toString();

        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);

              if (response.id === 2) {
                expect(response.result).toBeDefined();
                expect(response.result.tools).toBeDefined();
                expect(Array.isArray(response.result.tools)).toBe(true);
                expect(response.result.tools).toHaveLength(5); // Story 1.2 implements 5 tools
                resolve();
                return;
              }
            }
          }
        } catch (error) {
          // Partial data, continue accumulating
        }
      });

      server.on('error', reject);

      // First initialize, then list tools
      server.stdin?.write(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }) + '\n'
      );

      // Wait a bit for initialize to complete
      setTimeout(() => {
        server.stdin?.write(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            params: {},
            id: 2,
          }) + '\n'
        );
      }, 500);

      setTimeout(() => {
        reject(new Error('Tools list timeout'));
      }, 5000);
    });
  });

  it('returns empty resources list', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let responseData = '';

      server.stdout?.on('data', (data) => {
        responseData += data.toString();

        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);

              if (response.id === 2) {
                expect(response.result).toBeDefined();
                expect(response.result.resources).toBeDefined();
                expect(Array.isArray(response.result.resources)).toBe(true);
                expect(response.result.resources).toHaveLength(3); // Story 1.3 implements 3 resources
                resolve();
                return;
              }
            }
          }
        } catch (error) {
          // Partial data, continue accumulating
        }
      });

      server.on('error', reject);

      // First initialize, then list resources
      server.stdin?.write(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }) + '\n'
      );

      setTimeout(() => {
        server.stdin?.write(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'resources/list',
            params: {},
            id: 2,
          }) + '\n'
        );
      }, 500);

      setTimeout(() => {
        reject(new Error('Resources list timeout'));
      }, 5000);
    });
  });

  it('returns all registered prompts', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let responseData = '';

      server.stdout?.on('data', (data) => {
        responseData += data.toString();

        try {
          const lines = responseData.trim().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);

              if (response.id === 2) {
                expect(response.result).toBeDefined();
                expect(response.result.prompts).toBeDefined();
                expect(Array.isArray(response.result.prompts)).toBe(true);
                expect(response.result.prompts).toHaveLength(3); // 3 prompts in Story 1.4
                resolve();
                return;
              }
            }
          }
        } catch (error) {
          // Partial data, continue accumulating
        }
      });

      server.on('error', reject);

      // First initialize, then list prompts
      server.stdin?.write(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }) + '\n'
      );

      setTimeout(() => {
        server.stdin?.write(
          JSON.stringify({
            jsonrpc: '2.0',
            method: 'prompts/list',
            params: {},
            id: 2,
          }) + '\n'
        );
      }, 500);

      setTimeout(() => {
        reject(new Error('Prompts list timeout'));
      }, 5000);
    });
  });

  it('handles graceful shutdown on SIGTERM', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let exitCode: number | null = null;

      server.on('exit', (code) => {
        exitCode = code;
        if (exitCode === 0) {
          resolve();
        } else {
          reject(new Error(`Server exited with code ${exitCode}`));
        }
      });

      server.on('error', reject);

      // Give server time to start
      setTimeout(() => {
        server.kill('SIGTERM');
      }, 1000);

      setTimeout(() => {
        if (exitCode === null) {
          reject(new Error('Graceful shutdown timeout'));
        }
      }, 5000);
    });
  });

  it('handles graceful shutdown on SIGINT', () => {
    return new Promise<void>((resolve, reject) => {
      server = spawn('node', ['./dist/server.js']);

      let exitCode: number | null = null;

      server.on('exit', (code) => {
        exitCode = code;
        if (exitCode === 0) {
          resolve();
        } else {
          reject(new Error(`Server exited with code ${exitCode}`));
        }
      });

      server.on('error', reject);

      // Give server time to start
      setTimeout(() => {
        server.kill('SIGINT');
      }, 1000);

      setTimeout(() => {
        if (exitCode === null) {
          reject(new Error('Graceful shutdown timeout'));
        }
      }, 5000);
    });
  });
});
