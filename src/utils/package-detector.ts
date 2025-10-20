/**
 * Package.json Detection and Parsing
 *
 * Provides utilities for detecting and parsing package.json files to extract
 * framework and library information for intelligent preset recommendations.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { FileOperationError } from './errors.js';

/**
 * Package.json structure with relevant fields
 */
export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Detected dependency information
 */
export interface DetectedDependency {
  name: string;
  version: string;
  isDev: boolean;
}

/**
 * Package detection result
 */
export interface PackageDetectionResult {
  found: boolean;
  packageJson?: PackageJson;
  dependencies: DetectedDependency[];
  projectName?: string;
  filePath?: string;
}

/**
 * Framework type enumeration
 */
export enum FrameworkType {
  REACT = 'react',
  NEXT = 'next.js',
  VUE = 'vue',
  NUXT = 'nuxt',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  SVELTEKIT = 'sveltekit',
  EXPRESS = 'express',
  FASTIFY = 'fastify',
  NEST = 'nest.js',
  UNKNOWN = 'unknown',
}

/**
 * Detected framework information
 */
export interface DetectedFramework {
  type: FrameworkType;
  version: string;
  confidence: number; // 0-100
}

/**
 * Framework detection patterns
 */
const FRAMEWORK_PATTERNS: Record<
  string,
  { type: FrameworkType; weight: number }
> = {
  // Frontend frameworks
  next: { type: FrameworkType.NEXT, weight: 100 },
  react: { type: FrameworkType.REACT, weight: 90 },
  vue: { type: FrameworkType.VUE, weight: 90 },
  nuxt: { type: FrameworkType.NUXT, weight: 100 },
  '@angular/core': { type: FrameworkType.ANGULAR, weight: 100 },
  svelte: { type: FrameworkType.SVELTE, weight: 90 },
  '@sveltejs/kit': { type: FrameworkType.SVELTEKIT, weight: 100 },

  // Backend frameworks
  express: { type: FrameworkType.EXPRESS, weight: 80 },
  fastify: { type: FrameworkType.FASTIFY, weight: 90 },
  '@nestjs/core': { type: FrameworkType.NEST, weight: 100 },
};

/**
 * Detects package.json in the specified directory
 *
 * @param directory - Directory to search for package.json (defaults to current)
 * @returns Detection result with package.json data if found
 */
export async function detectPackageJson(
  directory: string = process.cwd()
): Promise<PackageDetectionResult> {
  const packageJsonPath = path.join(directory, 'package.json');

  try {
    logger.debug({ path: packageJsonPath }, 'Attempting to detect package.json');

    // Check if file exists
    try {
      await fs.access(packageJsonPath);
    } catch {
      logger.debug({ path: packageJsonPath }, 'Package.json not found');
      return {
        found: false,
        dependencies: [],
      };
    }

    // Read and parse package.json
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(content);

    // Extract dependencies
    const dependencies = extractDependencies(packageJson);

    logger.info(
      { path: packageJsonPath, dependencyCount: dependencies.length },
      'Package.json detected successfully'
    );

    return {
      found: true,
      packageJson,
      dependencies,
      projectName: packageJson.name,
      filePath: packageJsonPath,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Distinguish between parse errors and file errors
    if (error instanceof SyntaxError) {
      throw new FileOperationError(
        `Invalid JSON in package.json: ${errorMessage}`,
        { path: packageJsonPath, error },
        false
      );
    }

    throw new FileOperationError(
      `Failed to read package.json: ${errorMessage}`,
      { path: packageJsonPath, error },
      true
    );
  }
}

/**
 * Extracts dependencies from package.json
 *
 * @param packageJson - Parsed package.json object
 * @returns Array of detected dependencies
 */
export function extractDependencies(
  packageJson: PackageJson
): DetectedDependency[] {
  const dependencies: DetectedDependency[] = [];

  // Extract production dependencies
  if (packageJson.dependencies) {
    for (const [name, version] of Object.entries(packageJson.dependencies)) {
      dependencies.push({
        name,
        version,
        isDev: false,
      });
    }
  }

  // Extract dev dependencies
  if (packageJson.devDependencies) {
    for (const [name, version] of Object.entries(
      packageJson.devDependencies
    )) {
      dependencies.push({
        name,
        version,
        isDev: true,
      });
    }
  }

  return dependencies;
}

/**
 * Detects frameworks from dependencies
 *
 * @param dependencies - Array of detected dependencies
 * @returns Array of detected frameworks with confidence scores
 */
export function detectFrameworks(
  dependencies: DetectedDependency[]
): DetectedFramework[] {
  const frameworkMap = new Map<FrameworkType, DetectedFramework>();

  for (const dep of dependencies) {
    const pattern = FRAMEWORK_PATTERNS[dep.name];

    if (pattern) {
      const existing = frameworkMap.get(pattern.type);

      // If framework already detected, use higher confidence
      if (existing) {
        if (pattern.weight > existing.confidence) {
          frameworkMap.set(pattern.type, {
            type: pattern.type,
            version: dep.version,
            confidence: pattern.weight,
          });
        }
      } else {
        frameworkMap.set(pattern.type, {
          type: pattern.type,
          version: dep.version,
          confidence: pattern.weight,
        });
      }
    }
  }

  // Convert map to array and sort by confidence (descending)
  return Array.from(frameworkMap.values()).sort(
    (a, b) => b.confidence - a.confidence
  );
}

/**
 * Checks if a specific framework is present in dependencies
 *
 * @param dependencies - Array of detected dependencies
 * @param frameworkName - Framework package name to check
 * @returns True if framework is found
 */
export function hasFramework(
  dependencies: DetectedDependency[],
  frameworkName: string
): boolean {
  return dependencies.some((dep) => dep.name === frameworkName);
}

/**
 * Gets the version of a specific dependency
 *
 * @param dependencies - Array of detected dependencies
 * @param dependencyName - Dependency name to lookup
 * @returns Version string or undefined if not found
 */
export function getDependencyVersion(
  dependencies: DetectedDependency[],
  dependencyName: string
): string | undefined {
  const dep = dependencies.find((d) => d.name === dependencyName);
  return dep?.version;
}
