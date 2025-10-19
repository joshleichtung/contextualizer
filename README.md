# Contextualizer MCP Server

An MCP (Model Context Protocol) server for AI-optimized project setup and management. Enables Claude to set up and manage development projects with context monitoring, Git hooks, and memory management.

## Status

**Current Phase**: Story 1.1 - MCP Server Setup (COMPLETE)

This is a skeleton implementation providing the MCP server foundation. Tools, resources, and prompts will be added in subsequent stories.

## Requirements

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Development

### Build

```bash
npm run build
```

Builds the TypeScript project to `dist/` using tsup.

### Development Mode

```bash
npm run dev
```

Watches for changes and rebuilds automatically.

### Run Server

```bash
npm start
```

Starts the MCP server with stdio transport.

## Testing

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

Current coverage: 100% (all testable code)

### Type Checking

```bash
npm run typecheck
```

## Architecture

### Project Structure

```
contextualizer/
├── src/
│   ├── server.ts           # Main MCP server entry point
│   ├── types/
│   │   └── mcp.ts          # MCP type definitions
│   ├── tools/
│   │   └── index.ts        # Tool registry (empty - Story 1.2+)
│   ├── resources/
│   │   └── index.ts        # Resource registry (empty - Story 1.2+)
│   ├── prompts/
│   │   └── index.ts        # Prompt registry (empty - Story 1.2+)
│   └── utils/
│       └── logger.ts       # Pino logger wrapper
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── dist/                   # Build output
└── package.json
```

### MCP Protocol

The server implements the Model Context Protocol with stdio transport:

- **Communication**: JSON-RPC 2.0 over stdin/stdout
- **Capabilities**: Tools, Resources, Prompts
- **Transport**: StdioServerTransport

### Server Lifecycle

1. Initialize server with metadata and capabilities
2. Register request handlers (tools, resources, prompts)
3. Start stdio transport
4. Handle graceful shutdown (SIGINT/SIGTERM)

### Logging

Structured logging with pino:
- **Log file**: `.contextualizer/mcp.log`
- **Format**: JSON with timestamps
- **Levels**: error, warn, info, debug

## MCP Server Configuration

To use this server with Claude Desktop, add to your Claude configuration:

```json
{
  "mcpServers": {
    "contextualizer": {
      "command": "node",
      "args": ["/path/to/contextualizer/dist/server.js"]
    }
  }
}
```

## Development Status

### Story 1.1 - MCP Server Setup ✅

- [x] TypeScript project initialized
- [x] MCP SDK integrated with stdio transport
- [x] Server lifecycle implemented (startup, shutdown)
- [x] Logging infrastructure operational
- [x] Project structure established
- [x] Build system configured (tsup)
- [x] Testing infrastructure (Vitest)
- [x] Unit tests (44 tests passing)
- [x] Integration tests (MCP protocol validated)
- [x] 100% code coverage achieved

### Next Stories

- **Story 1.2**: Tool implementations (init_project, run_doctor, etc.)
- **Story 1.3**: Resource providers (config, diagnostics, presets)
- **Story 1.4**: Prompt templates (setup_wizard, health_check)

## Performance

Performance targets from NFR1-NFR4:

- ✅ Server startup: < 500ms
- ✅ MCP handshake: < 200ms
- ✅ Logging overhead: < 5ms

## Testing

### Test Coverage

- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

Note: `server.ts` is excluded from unit test coverage as it's fully tested via integration tests (spawned as a separate process).

### Test Files

- `tests/unit/types.test.ts` - Type definitions
- `tests/unit/registries.test.ts` - Tool/resource/prompt registries
- `tests/unit/logger.test.ts` - Logger functionality
- `tests/unit/server.test.ts` - Server configuration
- `tests/integration/mcp-protocol.test.ts` - Full MCP protocol

## Contributing

This project follows the BMAD (Build-Measure-Analyze-Deploy) workflow:

1. Read story requirements in `docs/stories/`
2. Follow architecture specifications in `docs/architecture/`
3. Implement with tests (unit + integration)
4. Ensure 80%+ code coverage
5. Update documentation

## License

MIT
