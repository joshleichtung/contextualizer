#!/usr/bin/env node

/**
 * Contextualizer MCP Server
 *
 * Main entry point for the MCP server. Implements the Model Context Protocol
 * to enable Claude to interact with Contextualizer's tools, resources, and prompts.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools/index.js';
import { RESOURCES } from './resources/index.js';
import { PROMPTS } from './prompts/index.js';
import { logger } from './utils/logger.js';

/**
 * Main server initialization and startup
 */
async function main(): Promise<void> {
  logger.info('Initializing Contextualizer MCP Server');

  // Initialize server with metadata and capabilities
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

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('Handling tools/list request');
    return {
      tools: TOOLS.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    logger.info({ tool: toolName }, 'Tool invocation started');

    const tool = TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      const error = `Unknown tool: ${toolName}`;
      logger.error({ tool: toolName }, error);
      throw new Error(error);
    }

    try {
      // Validate arguments against tool's inputSchema (Zod schema)
      const validationResult = (tool.inputSchema as any).safeParse(
        request.params.arguments || {}
      );

      if (!validationResult.success) {
        const error = `Invalid parameters: ${validationResult.error.message}`;
        logger.error({ tool: toolName, error }, 'Parameter validation failed');
        throw new Error(error);
      }

      const result = await tool.handler(validationResult.data);
      logger.info({ tool: toolName }, 'Tool invocation completed');
      // Return in MCP SDK expected format
      return {
        content: result.content,
        isError: result.isError,
      };
    } catch (error) {
      logger.error({ tool: toolName, error }, 'Tool invocation failed');
      throw error;
    }
  });

  // Register resource handlers
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    logger.debug('Handling resources/list request');
    return {
      resources: RESOURCES.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    logger.info({ uri }, 'Resource read started');

    const resource = RESOURCES.find((r) => r.uri === uri);
    if (!resource) {
      const error = `Unknown resource: ${uri}`;
      logger.error({ uri }, error);
      throw new Error(error);
    }

    try {
      const content = await resource.provider();
      logger.info({ uri }, 'Resource read completed');
      return { contents: [content] };
    } catch (error) {
      logger.error({ uri, error }, 'Resource read failed');
      throw error;
    }
  });

  // Register prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.debug('Handling prompts/list request');
    return {
      prompts: PROMPTS.map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const promptName = request.params.name;
    logger.info({ prompt: promptName }, 'Prompt retrieval started');

    const prompt = PROMPTS.find((p) => p.name === promptName);
    if (!prompt) {
      const error = `Unknown prompt: ${promptName}`;
      logger.error({ prompt: promptName }, error);
      throw new Error(error);
    }

    try {
      const messages = await prompt.provider(request.params.arguments || {});
      logger.info({ prompt: promptName }, 'Prompt retrieval completed');
      return { messages };
    } catch (error) {
      logger.error({ prompt: promptName, error }, 'Prompt retrieval failed');
      throw error;
    }
  });

  // Start stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Contextualizer MCP Server started successfully');

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    try {
      await server.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Start the server
main().catch((error) => {
  logger.error({ error }, 'Fatal error during server startup');
  process.exit(1);
});
