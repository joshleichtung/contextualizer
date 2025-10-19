/**
 * Logger Utility
 *
 * Provides structured logging with pino for the MCP server.
 * Logs are written to .contextualizer/mcp.log
 */

import pino from 'pino';

const logPath = '.contextualizer/mcp.log';

/**
 * Pino logger instance configured for MCP server
 * The transport automatically creates the directory if it doesn't exist
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino/file',
    options: {
      destination: logPath,
      mkdir: true,
    },
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
