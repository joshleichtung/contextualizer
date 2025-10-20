# Error Catalog

This document provides a comprehensive reference for all error types in the Contextualizer MCP server, including error codes, categories, recovery strategies, and examples.

## Error Categories

Errors are classified into the following categories:

- **validation**: Input validation and parameter errors
- **filesystem**: File and directory operation errors
- **git**: Git repository operation errors
- **configuration**: Configuration file and settings errors
- **network**: Network and external service errors
- **unknown**: Uncategorized errors

## Error Class Hierarchy

```
ContextualizerError (base)
├── ValidationError
├── FileOperationError
├── ConflictError
├── GitOperationError
├── NetworkError
└── ConfigurationError
```

## Error Reference

### ValidationError

**Error Code**: `VALIDATION_ERROR`
**Category**: `validation`
**Retryable**: No
**Severity**: Medium

**When it occurs**:
- Invalid parameter values provided to tools
- Missing required parameters
- Parameter type mismatches
- Schema validation failures

**Recovery Strategies**:
1. Check parameter format and values
2. Refer to tool documentation for valid inputs
3. Verify parameter types match expected schema
4. Ensure all required parameters are provided

**Example**:
```typescript
throw new ValidationError(
  'Invalid project name: must contain only alphanumeric characters',
  { projectName: 'my-project!' }
);
```

**Error Response**:
```
❌ Invalid project name: must contain only alphanumeric characters

**Error Code**: VALIDATION_ERROR
**Category**: validation

**Recovery Suggestions**:
1. Check parameter format and values
2. Refer to tool documentation for valid inputs

**Details**:
{
  "projectName": "my-project!"
}
```

---

### FileOperationError

**Error Code**: `FILE_OPERATION_ERROR`
**Category**: `filesystem`
**Retryable**: Yes (for transient errors like EBUSY, EACCES)
**Severity**: Medium to High

**When it occurs**:
- File read/write failures
- Permission denied errors
- File or directory not found
- Disk space exhausted
- File locks and contention (EBUSY)
- Too many open files (EMFILE)

**Recovery Strategies**:

For retryable errors:
1. Operation will be retried automatically (up to 3 attempts)
2. Check file permissions if error persists
3. Verify no other process is locking the file

For non-retryable errors:
1. Check file permissions and paths
2. Verify disk space is available
3. Ensure file or directory exists
4. Check file path syntax

**Example**:
```typescript
// Retryable error
throw new FileOperationError(
  'Failed to read file: /path/to/file.txt',
  { path: '/path/to/file.txt', error: 'EBUSY' },
  true // isRetryable
);

// Non-retryable error
throw new FileOperationError(
  'File not found: /path/to/missing.txt',
  { path: '/path/to/missing.txt' },
  false // not retryable
);
```

**Error Response** (with retry):
```
❌ Failed to read file: /path/to/file.txt

**Error Code**: FILE_OPERATION_ERROR
**Category**: filesystem
**Retry Attempts**: 2

**Recovery Suggestions**:
1. Operation will be retried automatically
2. Check file permissions if error persists

**Details**:

Operation trace:
  1. readFileWithRetry - {"path":"/path/to/file.txt"}
  2. Retry attempt 1 - {"error":"Error: EBUSY"}
  3. Retry attempt 2 - {"error":"Error: EBUSY"}

{
  "path": "/path/to/file.txt",
  "error": "EBUSY"
}
```

---

### ConflictError

**Error Code**: `CONFLICT_ERROR`
**Category**: `validation`
**Retryable**: No
**Severity**: Medium

**When it occurs**:
- Attempting to create resource that already exists
- Conflicting state or operation
- Version conflicts
- Merge conflicts

**Recovery Strategies**:
1. Review conflicting changes
2. Manually resolve conflicts if necessary
3. Choose different resource name
4. Update existing resource instead of creating new one

**Example**:
```typescript
throw new ConflictError(
  'Project already exists at path: /workspace/my-project',
  { projectPath: '/workspace/my-project' }
);
```

**Error Response**:
```
❌ Project already exists at path: /workspace/my-project

**Error Code**: CONFLICT_ERROR
**Category**: validation

**Recovery Suggestions**:
1. Review conflicting changes
2. Manually resolve conflicts if necessary

**Details**:
{
  "projectPath": "/workspace/my-project"
}
```

---

### GitOperationError

**Error Code**: `GIT_OPERATION_ERROR`
**Category**: `git`
**Retryable**: Yes (for lock contention and network issues)
**Severity**: Medium to High

**When it occurs**:
- Git lock file contention (.git/index.lock)
- Network failures during remote operations
- Repository not initialized
- Invalid git configuration
- Merge conflicts
- Detached HEAD state issues

**Recovery Strategies**:

For retryable errors:
1. Operation will be retried automatically (up to 3 attempts)
2. Check if git repository is locked by another process
3. Wait for other git operations to complete

For non-retryable errors:
1. Verify git repository is initialized
2. Check git remote configuration
3. Ensure working directory is clean
4. Verify git credentials for remote operations

**Example**:
```typescript
// Retryable error
throw new GitOperationError(
  'Git commit failed',
  { operation: 'commit', error: 'index.lock: File exists' },
  true // isRetryable
);

// Non-retryable error
throw new GitOperationError(
  'Not a git repository',
  { operation: 'status', cwd: '/path/to/dir' },
  false // not retryable
);
```

**Error Response** (with retry):
```
❌ Git operation 'commit' failed

**Error Code**: GIT_OPERATION_ERROR
**Category**: git
**Retry Attempts**: 1

**Recovery Suggestions**:
1. Operation will be retried automatically
2. Check if git repository is locked by another process

**Details**:

Operation trace:
  1. gitWithRetry - {"operation":"commit"}
  2. Retry attempt 1 - {"error":"Error: index.lock: File exists"}

{
  "operation": "commit",
  "error": "index.lock: File exists"
}
```

---

### NetworkError

**Error Code**: `NETWORK_ERROR`
**Category**: `network`
**Retryable**: Yes
**Severity**: Medium

**When it occurs**:
- Network connectivity failures
- Timeout connecting to external services
- DNS resolution failures
- Firewall blocking connections
- Service unavailable (503)

**Recovery Strategies**:
1. Operation will be retried automatically (up to 3 attempts)
2. Check network connectivity
3. Verify firewall settings if error persists
4. Check if external service is available
5. Verify proxy configuration if applicable

**Example**:
```typescript
throw new NetworkError(
  'Failed to connect to external service',
  { service: 'api.example.com', timeout: 5000 }
);
```

**Error Response**:
```
❌ Failed to connect to external service

**Error Code**: NETWORK_ERROR
**Category**: network
**Retry Attempts**: 3

**Recovery Suggestions**:
1. Operation will be retried automatically
2. Check network connectivity
3. Verify firewall settings if error persists

**Details**:
{
  "service": "api.example.com",
  "timeout": 5000
}
```

---

### ConfigurationError

**Error Code**: `CONFIGURATION_ERROR`
**Category**: `configuration`
**Retryable**: No
**Severity**: High

**When it occurs**:
- Invalid YAML syntax in config files
- Missing required configuration fields
- Invalid configuration values
- Configuration file not found
- Incompatible configuration schema version

**Recovery Strategies**:
1. Check .contextualizer/config.yaml syntax
2. Run diagnostics with run_doctor tool
3. Refer to configuration documentation
4. Validate YAML syntax with online validator
5. Check for required configuration fields
6. Restore from backup configuration

**Example**:
```typescript
throw new ConfigurationError(
  'Invalid configuration: missing required field "projectRoot"',
  { configPath: '.contextualizer/config.yaml' }
);
```

**Error Response**:
```
❌ Invalid configuration: missing required field "projectRoot"

**Error Code**: CONFIGURATION_ERROR
**Category**: configuration

**Recovery Suggestions**:
1. Check .contextualizer/config.yaml syntax
2. Run diagnostics with run_doctor tool
3. Refer to configuration documentation

**Details**:
{
  "configPath": ".contextualizer/config.yaml"
}
```

---

## Circuit Breaker Errors

### Circuit Breaker Open

**Error Code**: `CIRCUIT_BREAKER_OPEN`
**Category**: `network`
**Retryable**: No (must wait for reset)
**Severity**: High

**When it occurs**:
- Too many consecutive failures for a protected operation
- Circuit breaker threshold exceeded (default: 5 failures)
- System is protecting against cascading failures

**Recovery Strategies**:
1. Wait for circuit breaker to reset (default: 60 seconds)
2. Check underlying service health
3. Review recent error logs for root cause
4. Verify external dependencies are operational

**Example**:
```
❌ Circuit breaker 'filesystem' is OPEN - too many failures

**Error Code**: CIRCUIT_BREAKER_OPEN
**Category**: network

**Recovery Suggestions**:
1. Wait for circuit breaker to reset
2. Check underlying service health

**Details**:
{
  "state": "OPEN",
  "failureCount": 5
}
```

---

## Retryable vs Non-Retryable Errors

### Retryable Errors

Automatically retried with exponential backoff:

- **FileOperationError**: EBUSY, EACCES, EMFILE, EAGAIN
- **GitOperationError**: Lock contention, network timeouts
- **NetworkError**: All network errors

**Retry Configuration**:
- Max attempts: 3
- Initial delay: 100ms (filesystem), 200ms (git)
- Backoff multiplier: 2x
- Max delay: 5000ms

### Non-Retryable Errors

Fail immediately without retry:

- **ValidationError**: Always non-retryable
- **ConflictError**: Always non-retryable
- **ConfigurationError**: Always non-retryable
- **FileOperationError**: ENOENT (not found), ENOTDIR, etc.
- **GitOperationError**: Not a git repo, invalid config, etc.
- **Circuit Breaker Open**: Must wait for reset

---

## Breadcrumb Tracking

All errors include breadcrumb trails showing the sequence of operations leading to the error:

```
Operation trace:
  1. withErrorContext - operation started
  2. readFileWithRetry - {"path":"/config.yaml"}
  3. Retry attempt 1 - {"error":"EBUSY"}
  4. Retry attempt 2 - {"error":"EBUSY"}
```

Breadcrumbs help diagnose:
- Complex operation chains
- Nested function calls
- Retry sequences
- Operation timing

---

## Error Response Format

All errors follow this structured format:

```
❌ [Error message]

**Error Code**: [CODE]
**Category**: [category]
**Retry Attempts**: [count] (if retried)

**Recovery Suggestions**:
1. [First suggestion]
2. [Second suggestion]
...

**Details**:

Operation trace:
  1. [breadcrumb 1]
  2. [breadcrumb 2]
  ...

{
  "detail": "values",
  "as": "JSON"
}
```

---

## Common Error Scenarios

### Scenario 1: File Lock Contention

**Symptoms**: File operations fail with EBUSY errors

**Root Cause**: Another process has locked the file

**Resolution**:
1. Automatic retry will handle transient locks (3 attempts)
2. If persistent, check for other processes accessing the file
3. Ensure no other IDE or tool has the file open
4. Check for antivirus or backup software holding locks

### Scenario 2: Git Lock File

**Symptoms**: Git operations fail with "index.lock: File exists"

**Root Cause**: Git lock file from crashed or concurrent git operation

**Resolution**:
1. Automatic retry will handle if lock is released (3 attempts)
2. If persistent, manually remove .git/index.lock
3. Ensure no other git operations are running
4. Check for stale lock files from crashes

### Scenario 3: Circuit Breaker Tripped

**Symptoms**: All operations to a service fail immediately with CIRCUIT_BREAKER_OPEN

**Root Cause**: Too many failures triggered circuit breaker protection

**Resolution**:
1. Wait 60 seconds for automatic reset
2. Check underlying service health
3. Review logs for root cause of failures
4. Verify network connectivity and service availability

### Scenario 4: Configuration Errors

**Symptoms**: Tools fail with CONFIGURATION_ERROR

**Root Cause**: Invalid or missing configuration

**Resolution**:
1. Check .contextualizer/config.yaml syntax
2. Run `run_doctor` tool for diagnostics
3. Refer to configuration documentation
4. Validate YAML with online validator
5. Check for required fields

---

## Performance Impact

Error handling has minimal performance impact:

- **Error creation**: < 1ms
- **Breadcrumb addition**: < 1ms
- **Circuit breaker check**: < 1ms
- **Error formatting**: < 10ms
- **Retry delay**: 100-5000ms (exponential backoff)
- **Total retry overhead**: < 2s (filesystem), < 3s (git)

---

## Cross-References

- [Troubleshooting Guide](./troubleshooting.md) - Step-by-step resolution guides
- [Architecture Documentation](./architecture/mcp-server.md) - Error handling strategy
- [Security & Performance](./architecture/security-performance-testing.md) - Resilience patterns

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0
