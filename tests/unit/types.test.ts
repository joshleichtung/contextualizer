/**
 * Type Definitions Unit Tests
 *
 * Tests to verify type definitions are correctly structured
 */

import { describe, it, expect } from 'vitest';
import type {
  MCPTool,
  MCPResource,
  MCPPrompt,
  ToolResult,
  ResourceContent,
  PromptMessage,
} from '../../src/types/mcp.js';

describe('Type Definitions', () => {
  describe('MCPTool', () => {
    it('accepts valid tool definition', () => {
      const tool: MCPTool = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: async () => ({
          content: [{ type: 'text', text: 'result' }],
        }),
      };

      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A test tool');
      expect(typeof tool.handler).toBe('function');
    });
  });

  describe('MCPResource', () => {
    it('accepts valid resource definition', () => {
      const resource: MCPResource = {
        uri: 'contextualizer://test',
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'text/plain',
        provider: async () => ({
          uri: 'contextualizer://test',
          mimeType: 'text/plain',
          text: 'content',
        }),
      };

      expect(resource.uri).toBe('contextualizer://test');
      expect(resource.mimeType).toBe('text/plain');
      expect(typeof resource.provider).toBe('function');
    });
  });

  describe('MCPPrompt', () => {
    it('accepts valid prompt definition', () => {
      const prompt: MCPPrompt = {
        name: 'test_prompt',
        description: 'A test prompt',
        arguments: [
          {
            name: 'arg1',
            description: 'First argument',
            required: true,
          },
        ],
        provider: async () => [
          {
            role: 'user',
            content: { type: 'text', text: 'prompt message' },
          },
        ],
      };

      expect(prompt.name).toBe('test_prompt');
      expect(prompt.arguments).toHaveLength(1);
      expect(typeof prompt.provider).toBe('function');
    });
  });

  describe('ToolResult', () => {
    it('accepts text content', () => {
      const result: ToolResult = {
        content: [
          {
            type: 'text',
            text: 'Result text',
          },
        ],
      };

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe('Result text');
    });

    it('accepts error flag', () => {
      const result: ToolResult = {
        content: [{ type: 'text', text: 'Error message' }],
        isError: true,
      };

      expect(result.isError).toBe(true);
    });
  });

  describe('ResourceContent', () => {
    it('accepts text content', () => {
      const content: ResourceContent = {
        uri: 'contextualizer://test',
        mimeType: 'text/plain',
        text: 'content text',
      };

      expect(content.text).toBe('content text');
    });

    it('accepts blob content', () => {
      const content: ResourceContent = {
        uri: 'contextualizer://test',
        mimeType: 'application/octet-stream',
        blob: 'base64data',
      };

      expect(content.blob).toBe('base64data');
    });
  });

  describe('PromptMessage', () => {
    it('accepts user message', () => {
      const message: PromptMessage = {
        role: 'user',
        content: {
          type: 'text',
          text: 'User message',
        },
      };

      expect(message.role).toBe('user');
      expect(message.content.text).toBe('User message');
    });

    it('accepts assistant message', () => {
      const message: PromptMessage = {
        role: 'assistant',
        content: {
          type: 'text',
          text: 'Assistant message',
        },
      };

      expect(message.role).toBe('assistant');
    });
  });
});
