/**
 * Preset Definitions
 *
 * This file contains the preset configuration templates for Contextualizer.
 * Presets provide pre-configured setups for different development scenarios.
 */

/**
 * Memory section structure
 */
export interface MemorySection {
  title: string;
  content: string;
}

/**
 * Pre-commit hook check configuration
 */
export interface PreCommitCheck {
  name: string;
  failOn: 'errors' | 'warnings' | 'never';
}

/**
 * Pre-commit hook configuration
 */
export interface PreCommitHook {
  enabled: boolean;
  strictness?: 'strict' | 'balanced' | 'relaxed';
  checks?: PreCommitCheck[];
}

/**
 * Hooks configuration
 */
export interface HooksConfig {
  preCommit: PreCommitHook;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  sections: MemorySection[];
  context7Libraries?: string[];
}

/**
 * Context monitoring configuration
 */
export interface ContextMonitoringConfig {
  warningThreshold: number;
  criticalThreshold: number;
  boundaryDetection: 'aggressive' | 'balanced' | 'conservative';
}

/**
 * Complete preset definition
 */
export interface PresetDefinition {
  name: string;
  description: string;
  installationTime: string;
  contextMonitoring: ContextMonitoringConfig;
  hooks: HooksConfig;
  memory: MemoryConfig;
  skills?: string[];
  subagents?: string[];
  codingStandards?: string[];
}

/**
 * Minimal preset - basic context monitoring with minimal overhead
 */
export const minimalPreset: PresetDefinition = {
  name: 'minimal',
  description: 'Minimal preset with basic context monitoring',
  installationTime: '~30 seconds',
  contextMonitoring: {
    warningThreshold: 80,
    criticalThreshold: 95,
    boundaryDetection: 'balanced',
  },
  hooks: {
    preCommit: {
      enabled: false,
    },
  },
  memory: {
    sections: [
      {
        title: 'Project Context',
        content: '# Project Context\n\nProject-specific information.',
      },
    ],
  },
};

/**
 * Web-fullstack preset - comprehensive setup for full-stack web development
 */
export const webFullstackPreset: PresetDefinition = {
  name: 'web-fullstack',
  description: 'Full-stack web development with Next.js, React, TypeScript',
  installationTime: '~2 minutes',
  contextMonitoring: {
    warningThreshold: 75,
    criticalThreshold: 90,
    boundaryDetection: 'aggressive',
  },
  hooks: {
    preCommit: {
      enabled: true,
      strictness: 'balanced',
      checks: [
        { name: 'typecheck', failOn: 'errors' },
        { name: 'lint', failOn: 'errors' },
        { name: 'test', failOn: 'errors' },
      ],
    },
  },
  memory: {
    sections: [
      {
        title: 'Tech Stack',
        content:
          '# Tech Stack\n\n- Next.js\n- React\n- TypeScript\n- Tailwind CSS',
      },
      {
        title: 'Architecture Patterns',
        content:
          '# Architecture Patterns\n\n- Component-driven development\n- Server/client component separation',
      },
    ],
    context7Libraries: [
      '/vercel/next.js',
      '/facebook/react',
      '/microsoft/typescript',
    ],
  },
  skills: ['nextjs-expert', 'react-expert', 'typescript-expert'],
  subagents: ['code-reviewer', 'test-architect', 'doc-writer'],
  codingStandards: [
    'typescript-strict',
    'react-best-practices',
    'tailwind-utility-first',
  ],
};

/**
 * Hackathon preset - fast iteration mode with minimal constraints
 */
export const hackathonPreset: PresetDefinition = {
  name: 'hackathon',
  description: 'Fast iteration mode for hackathons and prototypes',
  installationTime: '~15 seconds',
  contextMonitoring: {
    warningThreshold: 90,
    criticalThreshold: 98,
    boundaryDetection: 'conservative',
  },
  hooks: {
    preCommit: {
      enabled: false,
    },
  },
  memory: {
    sections: [
      {
        title: 'Project Goals',
        content: '# Project Goals\n\nRapid prototyping and experimentation.',
      },
    ],
  },
};

/**
 * All available presets
 */
export const PRESETS: PresetDefinition[] = [
  minimalPreset,
  webFullstackPreset,
  hackathonPreset,
];
