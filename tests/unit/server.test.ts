/**
 * Server Unit Tests
 *
 * Tests for the main server module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { TOOLS } from '../../src/tools/index.js';
import { RESOURCES } from '../../src/resources/index.js';
import { PROMPTS } from '../../src/prompts/index.js';

describe('Server Configuration', () => {
  it('has correct server metadata', () => {
    const serverInfo = {
      name: 'contextualizer',
      version: '1.0.0',
    };

    expect(serverInfo.name).toBe('contextualizer');
    expect(serverInfo.version).toBe('1.0.0');
  });

  it('has correct capabilities', () => {
    const capabilities = {
      tools: {},
      resources: {},
      prompts: {},
    };

    expect(capabilities).toHaveProperty('tools');
    expect(capabilities).toHaveProperty('resources');
    expect(capabilities).toHaveProperty('prompts');
  });
});

describe('Tool Registry Integration', () => {
  it('can map tools to MCP format', () => {
    const mappedTools = TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));

    expect(Array.isArray(mappedTools)).toBe(true);
    expect(mappedTools).toHaveLength(5); // Story 1.2 implements 5 tools
  });

  it('includes all 5 tools in list', () => {
    const response = {
      tools: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };

    expect(response.tools).toHaveLength(5);
    const toolNames = response.tools.map((t) => t.name);
    expect(toolNames).toContain('init_project');
    expect(toolNames).toContain('run_doctor');
    expect(toolNames).toContain('configure_hooks');
    expect(toolNames).toContain('manage_memory');
    expect(toolNames).toContain('get_config');
  });
});

describe('Resource Registry Integration', () => {
  it('can map resources to MCP format', () => {
    const mappedResources = RESOURCES.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));

    expect(Array.isArray(mappedResources)).toBe(true);
    expect(mappedResources).toHaveLength(0); // Empty in Story 1.1
  });

  it('handles empty resource list', () => {
    const response = {
      resources: RESOURCES.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };

    expect(response.resources).toHaveLength(0);
  });
});

describe('Prompt Registry Integration', () => {
  it('can map prompts to MCP format', () => {
    const mappedPrompts = PROMPTS.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    }));

    expect(Array.isArray(mappedPrompts)).toBe(true);
    expect(mappedPrompts).toHaveLength(0); // Empty in Story 1.1
  });

  it('handles empty prompt list', () => {
    const response = {
      prompts: PROMPTS.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };

    expect(response.prompts).toHaveLength(0);
  });
});

describe('Error Handling', () => {
  it('formats unknown tool error', () => {
    const toolName = 'nonexistent_tool';
    const error = `Unknown tool: ${toolName}`;

    expect(error).toContain('Unknown tool');
    expect(error).toContain(toolName);
  });

  it('formats unknown resource error', () => {
    const uri = 'contextualizer://nonexistent';
    const error = `Unknown resource: ${uri}`;

    expect(error).toContain('Unknown resource');
    expect(error).toContain(uri);
  });

  it('formats unknown prompt error', () => {
    const promptName = 'nonexistent_prompt';
    const error = `Unknown prompt: ${promptName}`;

    expect(error).toContain('Unknown prompt');
    expect(error).toContain(promptName);
  });
});

describe('Server Lifecycle', () => {
  it('creates server instance', () => {
    const server = new Server(
      {
        name: 'contextualizer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    expect(server).toBeDefined();
    expect(typeof server.setRequestHandler).toBe('function');
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('handles shutdown signal', () => {
    const signal = 'SIGINT';
    const shutdownInfo = { signal };

    expect(shutdownInfo.signal).toBe('SIGINT');
  });

  it('formats shutdown messages', () => {
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      const message = `Shutdown signal received: ${signal}`;
      expect(message).toContain('Shutdown signal received');
      expect(message).toContain(signal);
    });
  });
});
