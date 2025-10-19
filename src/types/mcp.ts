/**
 * MCP Type Definitions
 *
 * This file defines the core types used by the Contextualizer MCP server
 * for tools, resources, and prompts.
 */

/**
 * JSON Schema type from MCP SDK
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  [key: string]: unknown;
}

/**
 * Tool result content type
 */
export interface ToolContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

/**
 * Result returned by tool handlers
 */
export interface ToolResult {
  content: ToolContent[];
  isError?: boolean;
}

/**
 * MCP Tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  handler: (params: unknown) => Promise<ToolResult>;
}

/**
 * Resource content returned by providers
 */
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  provider: () => Promise<ResourceContent>;
}

/**
 * Prompt message content
 */
export interface PromptContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
}

/**
 * Prompt message
 */
export interface PromptMessage {
  role: 'user' | 'assistant';
  content: PromptContent;
}

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  provider: (args: Record<string, string>) => Promise<PromptMessage[]>;
}
