/**
 * Circuit Breaker Pattern
 *
 * This module implements the circuit breaker pattern to prevent cascading
 * failures and protect external operations.
 */

import { ContextualizerError } from './errors.js';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

/**
 * Configuration for circuit breaker behavior
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenMaxAttempts: 3,
};

/**
 * Circuit breaker implementation
 *
 * Tracks failures and prevents operations when failure threshold is exceeded.
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests rejected immediately
 * - HALF_OPEN: Testing recovery, limited requests allowed
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG
  ) {}

  /**
   * Execute an operation through the circuit breaker
   *
   * @param fn - Async function to execute
   * @returns Result of the function
   * @throws Error if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      const now = new Date();
      const timeSinceFailure =
        now.getTime() - (this.lastFailureTime?.getTime() || 0);

      if (timeSinceFailure >= this.config.resetTimeoutMs) {
        // Try half-open state
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new ContextualizerError(
          `Circuit breaker '${this.name}' is OPEN - too many failures`,
          'CIRCUIT_BREAKER_OPEN',
          'network',
          { state: this.state, failureCount: this.failureCount },
          false,
          [
            'Wait for circuit breaker to reset',
            'Check underlying service health',
          ],
          false
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenMaxAttempts) {
        // Circuit recovered
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      // Half-open failure -> back to open
      this.state = CircuitState.OPEN;
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        // Too many failures -> open circuit
        this.state = CircuitState.OPEN;
      }
    }
  }

  /**
   * Get the current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Global circuit breaker registry
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker by name
 *
 * @param name - Unique name for the circuit breaker
 * @param config - Optional configuration (only used when creating new circuit breaker)
 * @returns Circuit breaker instance
 */
export function getCircuitBreaker(
  name: string,
  config?: CircuitBreakerConfig
): CircuitBreaker {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name)!;
}
