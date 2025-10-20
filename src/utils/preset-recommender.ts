/**
 * Preset Recommendation Engine
 *
 * Analyzes detected dependencies and frameworks to recommend the most
 * appropriate Contextualizer preset for a project.
 */

import { logger } from './logger.js';
import {
  DetectedDependency,
  DetectedFramework,
  FrameworkType,
} from './package-detector.js';
import type { PresetDefinition } from '../config/presets.js';

/**
 * Preset recommendation with confidence score
 */
export interface PresetRecommendation {
  preset: string;
  confidence: number; // 0-100
  reasons: string[];
  alternatives?: Array<{ preset: string; confidence: number }>;
}

/**
 * Preset matching rule
 */
interface PresetRule {
  preset: string;
  frameworks?: FrameworkType[];
  dependencies?: string[];
  weight: number;
  reason: string;
}

/**
 * Preset matching rules
 * Rules are evaluated and scores are accumulated
 */
const PRESET_RULES: PresetRule[] = [
  // Web-fullstack preset rules
  {
    preset: 'web-fullstack',
    frameworks: [FrameworkType.NEXT],
    weight: 90,
    reason: 'Next.js detected (ideal for web-fullstack)',
  },
  {
    preset: 'web-fullstack',
    frameworks: [FrameworkType.REACT],
    dependencies: ['typescript'],
    weight: 80,
    reason: 'React + TypeScript detected',
  },
  {
    preset: 'web-fullstack',
    frameworks: [FrameworkType.VUE, FrameworkType.NUXT],
    weight: 75,
    reason: 'Vue/Nuxt framework detected',
  },
  {
    preset: 'web-fullstack',
    frameworks: [FrameworkType.ANGULAR],
    weight: 75,
    reason: 'Angular framework detected',
  },
  {
    preset: 'web-fullstack',
    dependencies: ['tailwindcss'],
    weight: 20,
    reason: 'Tailwind CSS detected',
  },
  {
    preset: 'web-fullstack',
    frameworks: [FrameworkType.EXPRESS, FrameworkType.FASTIFY, FrameworkType.NEST],
    weight: 70,
    reason: 'Backend framework detected',
  },

  // Hackathon preset rules
  {
    preset: 'hackathon',
    dependencies: ['vite'],
    weight: 60,
    reason: 'Vite detected (fast development setup)',
  },
  {
    preset: 'hackathon',
    frameworks: [FrameworkType.SVELTE, FrameworkType.SVELTEKIT],
    weight: 65,
    reason: 'Svelte detected (rapid prototyping)',
  },

  // Minimal preset rules (fallback, low weight)
  {
    preset: 'minimal',
    weight: 10,
    reason: 'Minimal setup suitable for simple projects',
  },
];

/**
 * Recommends a preset based on detected frameworks and dependencies
 *
 * @param frameworks - Array of detected frameworks
 * @param dependencies - Array of detected dependencies
 * @returns Preset recommendation with confidence score and reasoning
 */
export function recommendPreset(
  frameworks: DetectedFramework[],
  dependencies: DetectedDependency[]
): PresetRecommendation {
  logger.debug(
    { frameworkCount: frameworks.length, dependencyCount: dependencies.length },
    'Starting preset recommendation'
  );

  // Calculate scores for each preset
  const presetScores = new Map<string, { score: number; reasons: string[] }>();

  // Initialize all presets with zero score
  const allPresets = ['web-fullstack', 'hackathon', 'minimal'];
  for (const preset of allPresets) {
    presetScores.set(preset, { score: 0, reasons: [] });
  }

  // Evaluate each rule
  for (const rule of PRESET_RULES) {
    if (ruleMatches(rule, frameworks, dependencies)) {
      const current = presetScores.get(rule.preset)!;
      current.score += rule.weight;
      current.reasons.push(rule.reason);
    }
  }

  // Find the preset with highest score
  let topPreset = 'minimal';
  let topScore = 0;
  const alternatives: Array<{ preset: string; confidence: number }> = [];

  for (const [preset, data] of presetScores.entries()) {
    if (data.score > topScore) {
      // Current top becomes alternative
      if (topScore > 0) {
        alternatives.push({
          preset: topPreset,
          confidence: normalizeScore(topScore),
        });
      }

      topPreset = preset;
      topScore = data.score;
    } else if (data.score > 0) {
      alternatives.push({
        preset,
        confidence: normalizeScore(data.score),
      });
    }
  }

  // Sort alternatives by confidence descending
  alternatives.sort((a, b) => b.confidence - a.confidence);

  const recommendation: PresetRecommendation = {
    preset: topPreset,
    confidence: normalizeScore(topScore),
    reasons: presetScores.get(topPreset)!.reasons,
    alternatives: alternatives.length > 0 ? alternatives.slice(0, 2) : undefined,
  };

  logger.info(
    { preset: recommendation.preset, confidence: recommendation.confidence },
    'Preset recommendation generated'
  );

  return recommendation;
}

/**
 * Checks if a rule matches the detected frameworks and dependencies
 *
 * @param rule - Preset matching rule
 * @param frameworks - Detected frameworks
 * @param dependencies - Detected dependencies
 * @returns True if rule conditions are met
 */
function ruleMatches(
  rule: PresetRule,
  frameworks: DetectedFramework[],
  dependencies: DetectedDependency[]
): boolean {
  // Check framework requirements
  if (rule.frameworks && rule.frameworks.length > 0) {
    const hasRequiredFramework = rule.frameworks.some((requiredType) =>
      frameworks.some((fw) => fw.type === requiredType)
    );

    if (!hasRequiredFramework) {
      return false;
    }
  }

  // Check dependency requirements
  if (rule.dependencies && rule.dependencies.length > 0) {
    const hasRequiredDeps = rule.dependencies.every((requiredDep) =>
      dependencies.some((dep) => dep.name === requiredDep)
    );

    if (!hasRequiredDeps) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes a raw score to a 0-100 confidence percentage
 *
 * @param score - Raw accumulated score
 * @returns Confidence percentage (0-100)
 */
function normalizeScore(score: number): number {
  // Max realistic score is around 200 (multiple high-weight rules)
  // We'll normalize to 0-100 range
  const normalized = Math.min(100, Math.round((score / 200) * 100));
  return Math.max(0, normalized);
}

/**
 * Validates a preset recommendation meets minimum quality thresholds
 *
 * @param recommendation - Preset recommendation to validate
 * @returns True if recommendation meets quality standards
 */
export function isRecommendationConfident(
  recommendation: PresetRecommendation
): boolean {
  // Consider recommendation confident if confidence >= 40%
  return recommendation.confidence >= 40;
}

/**
 * Formats a preset recommendation into a user-friendly message
 *
 * @param recommendation - Preset recommendation
 * @returns Formatted recommendation message
 */
export function formatRecommendation(
  recommendation: PresetRecommendation
): string {
  let message = `**Recommended Preset**: ${recommendation.preset}\n`;
  message += `**Confidence**: ${recommendation.confidence}%\n\n`;

  if (recommendation.reasons.length > 0) {
    message += '**Reasons**:\n';
    recommendation.reasons.forEach((reason, index) => {
      message += `${index + 1}. ${reason}\n`;
    });
  }

  if (recommendation.alternatives && recommendation.alternatives.length > 0) {
    message += '\n**Alternative Presets**:\n';
    recommendation.alternatives.forEach((alt) => {
      message += `- ${alt.preset} (${alt.confidence}% confidence)\n`;
    });
  }

  return message;
}

/**
 * Gets preset recommendation based on project type heuristics
 * Used as fallback when package.json detection is not available
 *
 * @param projectType - Simple project type indicator
 * @returns Basic preset recommendation
 */
export function getDefaultRecommendation(
  projectType: 'web' | 'minimal' | 'prototype' = 'minimal'
): PresetRecommendation {
  const recommendations: Record<string, PresetRecommendation> = {
    web: {
      preset: 'web-fullstack',
      confidence: 50,
      reasons: ['Default recommendation for web projects'],
    },
    prototype: {
      preset: 'hackathon',
      confidence: 50,
      reasons: ['Default recommendation for prototypes'],
    },
    minimal: {
      preset: 'minimal',
      confidence: 50,
      reasons: ['Default minimal setup'],
    },
  };

  return recommendations[projectType];
}
