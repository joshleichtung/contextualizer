# Troubleshooting Guide

This guide provides step-by-step solutions for common errors and issues with the Contextualizer MCP server.

## Quick Start

1. **Check the error code**: Look for the error code in the error message (e.g., `VALIDATION_ERROR`)
2. **Read recovery suggestions**: Follow the numbered suggestions in the error message
3. **Review operation trace**: Check the breadcrumb trail for the sequence of operations
4. **Find your error below**: Search this guide for your specific error or symptom

---

## Common Issues

### File Operation Failures

#### Symptom: "Failed to read file" with EBUSY error

**Root Cause**: File is locked by another process

**Step-by-Step Resolution**:

1. **Wait for automatic retry**: The system will retry 3 times automatically
2. **Check for locking processes**:
   ```bash
   # On macOS/Linux
   lsof /path/to/file

   # On Windows
   handle.exe /path/to/file
   ```
3. **Close interfering applications**:
   - Close IDEs or editors with the file open
   - Check for antivirus or backup software
   - Ensure no other automation tools are accessing the file
4. **Manual intervention** (if retry fails):
   - Wait 30 seconds and try again
   - Restart any processes holding the file
   - Reboot if file locks persist

**Prevention**:
- Close files in editors before running operations
- Coordinate with team members on shared files
- Use file watching tools to detect conflicts

---

#### Symptom: "Permission denied" (EACCES) errors

**Root Cause**: Insufficient file permissions

**Step-by-Step Resolution**:

1. **Check file permissions**:
   ```bash
   ls -la /path/to/file
   ```
2. **Verify ownership**:
   ```bash
   stat /path/to/file
   ```
3. **Fix permissions if needed**:
   ```bash
   # Make file readable/writable
   chmod 644 /path/to/file

   # Make directory accessible
   chmod 755 /path/to/directory
   ```
4. **Check parent directory permissions**:
   ```bash
   ls -la /path/to/
   ```
5. **Verify user has access**:
   - Ensure current user owns the file or is in the correct group
   - Check for ACLs or extended attributes restricting access

**Prevention**:
- Set correct permissions during file creation
- Use consistent user/group ownership
- Document permission requirements

---

#### Symptom: "Too many open files" (EMFILE)

**Root Cause**: System file descriptor limit exceeded

**Step-by-Step Resolution**:

1. **Check current limit**:
   ```bash
   ulimit -n
   ```
2. **Increase limit temporarily**:
   ```bash
   ulimit -n 4096
   ```
3. **Increase limit permanently** (macOS):
   - Edit `/etc/launchd.conf`:
     ```
     limit maxfiles 4096 unlimited
     ```
   - Reboot for changes to take effect
4. **Increase limit permanently** (Linux):
   - Edit `/etc/security/limits.conf`:
     ```
     * soft nofile 4096
     * hard nofile 8192
     ```
   - Re-login for changes to take effect
5. **Close unused file handles**:
   - Restart the MCP server
   - Check for file descriptor leaks

**Prevention**:
- Process files in batches
- Close files explicitly after use
- Monitor file descriptor usage

---

### Git Operation Failures

#### Symptom: "index.lock: File exists"

**Root Cause**: Stale git lock file from crashed or concurrent operation

**Step-by-Step Resolution**:

1. **Wait for automatic retry**: System retries 3 times with delays
2. **Check for running git processes**:
   ```bash
   ps aux | grep git
   ```
3. **Wait for concurrent operations**: If git is running, wait for completion
4. **Remove stale lock** (if process not running):
   ```bash
   rm .git/index.lock
   ```
5. **Verify git repository health**:
   ```bash
   git status
   git fsck
   ```

**Prevention**:
- Avoid concurrent git operations on same repository
- Use proper git hooks to prevent conflicts
- Implement repository-level locking for automation

---

#### Symptom: "Not a git repository"

**Root Cause**: Operation attempted in non-git directory

**Step-by-Step Resolution**:

1. **Verify current directory**:
   ```bash
   pwd
   git status
   ```
2. **Check for .git directory**:
   ```bash
   ls -la .git
   ```
3. **Initialize repository if needed**:
   ```bash
   git init
   ```
4. **Navigate to correct directory**:
   ```bash
   cd /path/to/git/repo
   ```

**Prevention**:
- Verify working directory before git operations
- Use absolute paths in configurations
- Check git status before operations

---

#### Symptom: Git network timeout

**Root Cause**: Network issues or slow remote server

**Step-by-Step Resolution**:

1. **Check network connectivity**:
   ```bash
   ping github.com
   ```
2. **Verify git remote configuration**:
   ```bash
   git remote -v
   ```
3. **Test remote access**:
   ```bash
   git ls-remote
   ```
4. **Increase git timeout**:
   ```bash
   git config --global http.timeout 300
   ```
5. **Check firewall/proxy settings**:
   - Verify firewall allows git protocol
   - Configure proxy if needed:
     ```bash
     git config --global http.proxy http://proxy.example.com:8080
     ```

**Prevention**:
- Use stable network connections
- Configure appropriate timeouts
- Consider using SSH instead of HTTPS

---

### Configuration Errors

#### Symptom: "Invalid configuration: missing required field"

**Root Cause**: Configuration file is incomplete or malformed

**Step-by-Step Resolution**:

1. **Locate configuration file**:
   ```bash
   cat .contextualizer/config.yaml
   ```
2. **Validate YAML syntax**:
   - Use online YAML validator
   - Check for indentation errors
   - Verify no tabs (use spaces only)
3. **Compare with example config**:
   - Check documentation for required fields
   - Verify field names are correct
4. **Add missing fields**:
   ```yaml
   projectRoot: /path/to/project
   # Add other required fields
   ```
5. **Run diagnostics**:
   ```bash
   # Use run_doctor tool
   ```

**Prevention**:
- Use configuration templates
- Validate configuration after changes
- Keep backup of working configuration

---

#### Symptom: "YAML syntax error"

**Root Cause**: Invalid YAML formatting

**Step-by-Step Resolution**:

1. **Check error message for line number**
2. **Common YAML issues**:
   - **Tabs**: YAML requires spaces, not tabs
     ```yaml
     # Wrong (tab-indented)
     	key: value

     # Right (space-indented)
       key: value
     ```
   - **Inconsistent indentation**:
     ```yaml
     # Wrong
     parent:
      child: value
       grandchild: value

     # Right
     parent:
       child: value
       grandchild: value
     ```
   - **Unquoted special characters**:
     ```yaml
     # Wrong
     message: Error: something failed

     # Right
     message: "Error: something failed"
     ```
3. **Validate with tools**:
   - Use yamllint: `yamllint config.yaml`
   - Online validators: yamllint.com
4. **Restore from backup if needed**

**Prevention**:
- Use YAML-aware editor with syntax highlighting
- Enable YAML validation in editor
- Run yamllint before committing changes

---

### Circuit Breaker Errors

#### Symptom: "Circuit breaker is OPEN - too many failures"

**Root Cause**: Too many consecutive failures triggered protection

**Step-by-Step Resolution**:

1. **Understand the protection**: Circuit breaker prevents cascading failures
2. **Wait for automatic reset**: Circuit resets after 60 seconds
3. **Review recent errors**:
   - Check logs for underlying failures
   - Identify root cause of repeated failures
4. **Fix underlying issue**:
   - For filesystem: Check permissions, disk space
   - For git: Check repository health, network
   - For network: Check connectivity, service health
5. **Verify service health**:
   ```bash
   # Check disk space
   df -h

   # Check file permissions
   ls -la

   # Test git operations
   git status
   ```
6. **Manual reset** (if needed):
   - Restart MCP server
   - Circuit breakers reset on restart

**Prevention**:
- Monitor error rates
- Fix issues before circuit breaker trips
- Implement proper error handling in operations

---

### Validation Errors

#### Symptom: "Invalid parameter format"

**Root Cause**: Parameter doesn't match expected schema

**Step-by-Step Resolution**:

1. **Read error details**: Check which parameter is invalid
2. **Review tool documentation**: Verify parameter requirements
3. **Check parameter type**:
   - String vs number vs boolean
   - Array vs object
4. **Verify parameter format**:
   - File paths: Use absolute paths
   - Dates: Use ISO 8601 format
   - URLs: Include protocol (https://)
5. **Example fixes**:
   ```javascript
   // Wrong
   { projectName: "my-project!" }

   // Right
   { projectName: "my-project" }

   // Wrong
   { date: "10/19/2025" }

   // Right
   { date: "2025-10-19" }
   ```

**Prevention**:
- Validate inputs before calling tools
- Use schema validation in your code
- Refer to tool documentation

---

## Advanced Troubleshooting

### Analyzing Operation Traces

Error messages include breadcrumb trails showing operation sequences:

```
Operation trace:
  1. withErrorContext - {"operation":"init_project"}
  2. readFileWithRetry - {"path":"config.yaml"}
  3. Retry attempt 1 - {"error":"EBUSY"}
  4. Retry attempt 2 - {"error":"EBUSY"}
```

**How to use traces**:

1. **Identify the failing operation**: Look at the last breadcrumb
2. **Check operation parameters**: Review the details in each breadcrumb
3. **Understand the sequence**: Follow the chain of operations
4. **Look for patterns**: Repeated operations may indicate loops or retry issues

---

### Debugging with Breadcrumbs

Breadcrumbs help diagnose complex issues:

**Example 1: Nested Operations**
```
Operation trace:
  1. init_project
  2. ensureDirWithRetry - {"path":".contextualizer"}
  3. writeFileWithRetry - {"path":"config.yaml"}
  4. Retry attempt 1
```

This shows: Project initialization → Create directory → Write config → Retry

**Example 2: Multiple Retries**
```
Operation trace:
  1. configure_hooks
  2. gitWithRetry - {"operation":"add"}
  3. Retry attempt 1
  4. Retry attempt 2
  5. Retry attempt 3
```

This shows: All retry attempts exhausted for git add operation

---

### Understanding Retry Behavior

**Retry Configuration**:
- Filesystem operations: 3 attempts, 100ms base delay, 2x backoff
- Git operations: 3 attempts, 200ms base delay, 2x backoff
- Max delay: 5000ms

**Delay Sequence** (filesystem):
1. First attempt: Immediate
2. Retry 1: 100ms delay
3. Retry 2: 200ms delay
4. Retry 3: 400ms delay
5. Total time: ~700ms + operation time

**When retries stop**:
- Max attempts reached (3)
- Non-retryable error encountered
- Circuit breaker opens
- Operation succeeds

---

### Performance Issues

#### Symptom: Operations are slow

**Diagnosis**:

1. **Check retry count in errors**: High retry counts indicate issues
2. **Monitor circuit breaker state**: Frequent opening indicates problems
3. **Review breadcrumb timing**: Look for slow operations
4. **Check system resources**:
   ```bash
   # CPU usage
   top

   # Disk I/O
   iostat

   # Network latency
   ping example.com
   ```

**Resolution**:

1. **Reduce retries if appropriate**: Adjust retry configuration
2. **Fix underlying issues**: Address root causes of failures
3. **Optimize operations**: Batch operations where possible
4. **Scale resources**: Increase system resources if needed

---

## Getting Help

### Before Seeking Support

1. **Collect error information**:
   - Full error message including code and category
   - Operation trace (breadcrumbs)
   - Error details (JSON)
   - Retry attempts count

2. **Check this guide**: Search for your error code or symptom

3. **Review logs**: Check MCP server logs for additional context

4. **Verify configuration**: Ensure configuration is valid

### Information to Provide

When reporting issues, include:

- **Error message**: Complete error with code and category
- **Operation trace**: Full breadcrumb trail
- **Configuration**: Relevant configuration settings
- **Environment**:
  - Operating system and version
  - Node.js version
  - MCP server version
- **Steps to reproduce**: Detailed steps to trigger the error
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens

### Support Channels

- **Documentation**: Check error catalog and troubleshooting guide
- **GitHub Issues**: Report bugs and request features
- **Community**: Discuss issues and solutions

---

## Preventive Measures

### Best Practices

1. **Validate inputs**: Check parameters before calling tools
2. **Handle errors gracefully**: Implement proper error handling
3. **Monitor operations**: Track error rates and patterns
4. **Maintain configuration**: Keep configuration files up to date
5. **Review logs regularly**: Catch issues early
6. **Test changes**: Validate configuration changes before deployment
7. **Backup configuration**: Keep working configuration backups
8. **Document customizations**: Track changes to default settings

### Monitoring Recommendations

1. **Error rates**: Track errors by category
2. **Retry patterns**: Monitor retry frequency and success rates
3. **Circuit breaker state**: Alert on circuit breaker opening
4. **Operation timing**: Track slow operations
5. **Resource usage**: Monitor disk, memory, network

---

## FAQ

### Why do operations retry automatically?

Automatic retry handles transient failures (file locks, network glitches) without user intervention. Most transient issues resolve within seconds.

### How long does retry take?

- Filesystem: ~700ms for 3 attempts
- Git: ~1400ms for 3 attempts
- Network: Varies by timeout settings

### Can I disable retries?

Retries are built into resilient operations. To bypass, use direct filesystem/git operations instead of resilient wrappers.

### What is a circuit breaker?

Circuit breakers prevent cascading failures by stopping operations after too many failures. They automatically reset after a timeout.

### When should I manually intervene?

Manual intervention needed when:
- Errors persist after retries
- Circuit breaker remains open
- Configuration is invalid
- Underlying system issues exist

### How do I reset a circuit breaker?

Circuit breakers reset automatically after 60 seconds. To force reset, restart the MCP server.

---

## Cross-References

- [Error Catalog](./error-catalog.md) - Comprehensive error reference
- [Architecture Documentation](./architecture/mcp-server.md) - Error handling strategy
- [Configuration Guide](./configuration.md) - Configuration documentation

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0
