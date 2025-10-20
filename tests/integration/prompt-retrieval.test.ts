/**
 * Integration tests for prompt retrieval through MCP protocol
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

describe('Prompt Retrieval Integration', () => {
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

  describe('prompts/list', () => {
    it('returns all 3 prompts', async () => {
      const response = await sendRequest('prompts/list');

      expect(response.result).toBeDefined();
      expect(response.result.prompts).toBeDefined();
      expect(response.result.prompts).toHaveLength(3);
    });

    it('includes setup_wizard prompt', async () => {
      const response = await sendRequest('prompts/list');
      const names = response.result.prompts.map((p: any) => p.name);
      expect(names).toContain('setup_wizard');
    });

    it('includes health_check prompt', async () => {
      const response = await sendRequest('prompts/list');
      const names = response.result.prompts.map((p: any) => p.name);
      expect(names).toContain('health_check');
    });

    it('includes optimize_context prompt', async () => {
      const response = await sendRequest('prompts/list');
      const names = response.result.prompts.map((p: any) => p.name);
      expect(names).toContain('optimize_context');
    });

    it('includes correct metadata for each prompt', async () => {
      const response = await sendRequest('prompts/list');
      response.result.prompts.forEach((prompt: any) => {
        expect(prompt.name).toBeTruthy();
        expect(prompt.description).toBeTruthy();
        expect(prompt.arguments).toBeDefined();
      });
    });

    it('setup_wizard has project_type argument', async () => {
      const response = await sendRequest('prompts/list');
      const setupWizard = response.result.prompts.find(
        (p: any) => p.name === 'setup_wizard',
      );
      expect(setupWizard.arguments).toHaveLength(1);
      expect(setupWizard.arguments[0].name).toBe('project_type');
      expect(setupWizard.arguments[0].required).toBe(false);
    });

    it('health_check has no arguments', async () => {
      const response = await sendRequest('prompts/list');
      const healthCheck = response.result.prompts.find(
        (p: any) => p.name === 'health_check',
      );
      expect(healthCheck.arguments).toHaveLength(0);
    });

    it('optimize_context has strategy argument', async () => {
      const response = await sendRequest('prompts/list');
      const optimizeContext = response.result.prompts.find(
        (p: any) => p.name === 'optimize_context',
      );
      expect(optimizeContext.arguments).toHaveLength(1);
      expect(optimizeContext.arguments[0].name).toBe('strategy');
      expect(optimizeContext.arguments[0].required).toBe(false);
    });

    it('prompt descriptions are clear and informative', async () => {
      const response = await sendRequest('prompts/list');
      response.result.prompts.forEach((prompt: any) => {
        expect(prompt.description.length).toBeGreaterThan(20);
      });
    });
  });

  describe('prompts/get - setup_wizard', () => {
    it('retrieves setup_wizard with project_type argument', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'setup_wizard',
        arguments: { project_type: 'nextjs' },
      });

      expect(response.result).toBeDefined();
      expect(response.result.messages).toBeDefined();
      expect(response.result.messages).toHaveLength(1);
    });

    it('retrieves setup_wizard without project_type argument', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'setup_wizard',
      });

      expect(response.result).toBeDefined();
      expect(response.result.messages).toBeDefined();
      expect(response.result.messages).toHaveLength(1);
    });

    it('message has correct format with project_type', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'setup_wizard',
        arguments: { project_type: 'nextjs' },
      });

      const message = response.result.messages[0];
      expect(message.role).toBe('user');
      expect(message.content.type).toBe('text');
      expect(message.content.text).toBeTruthy();
      expect(message.content.text).toContain('nextjs');
    });

    it('message includes preset information', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'setup_wizard',
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('minimal');
      expect(text).toContain('web-fullstack');
      expect(text).toContain('hackathon');
    });

    it('message mentions Epic 2 and init_project', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'setup_wizard',
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('Epic 2');
      expect(text).toContain('init_project');
    });
  });

  describe('prompts/get - health_check', () => {
    it('retrieves health_check successfully', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'health_check',
      });

      expect(response.result).toBeDefined();
      expect(response.result.messages).toBeDefined();
      expect(response.result.messages).toHaveLength(1);
    });

    it('message has correct format', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'health_check',
      });

      const message = response.result.messages[0];
      expect(message.role).toBe('user');
      expect(message.content.type).toBe('text');
      expect(message.content.text).toBeTruthy();
    });

    it('message mentions Epic 5 and run_doctor', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'health_check',
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('Epic 5');
      expect(text).toContain('run_doctor');
    });

    it('message describes diagnostic checks', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'health_check',
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('15+');
      expect(text).toContain('checks');
    });
  });

  describe('prompts/get - optimize_context', () => {
    it('retrieves optimize_context with strategy argument', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'optimize_context',
        arguments: { strategy: 'aggressive' },
      });

      expect(response.result).toBeDefined();
      expect(response.result.messages).toBeDefined();
      expect(response.result.messages).toHaveLength(1);
    });

    it('retrieves optimize_context without strategy argument', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'optimize_context',
      });

      expect(response.result).toBeDefined();
      expect(response.result.messages).toBeDefined();
      expect(response.result.messages).toHaveLength(1);
    });

    it('message has correct format with aggressive strategy', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'optimize_context',
        arguments: { strategy: 'aggressive' },
      });

      const message = response.result.messages[0];
      expect(message.role).toBe('user');
      expect(message.content.type).toBe('text');
      expect(message.content.text).toBeTruthy();
      expect(message.content.text).toContain('aggressive');
    });

    it('message includes strategy-specific guidance', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'optimize_context',
        arguments: { strategy: 'conservative' },
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('conservative');
      expect(text).toContain('Conservative Strategy');
    });

    it('defaults to balanced strategy when not specified', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'optimize_context',
      });

      const text = response.result.messages[0].content.text;
      expect(text).toContain('balanced');
    });
  });

  describe('prompts/get - error handling', () => {
    it('returns error for invalid prompt name', async () => {
      const response = await sendRequest('prompts/get', {
        name: 'invalid_prompt',
      });

      expect(response.error).toBeDefined();
    });

    it('handles missing prompt name parameter', async () => {
      const response = await sendRequest('prompts/get', {});

      expect(response.error).toBeDefined();
    });
  });
});
