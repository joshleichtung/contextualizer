/**
 * Preset Definitions
 *
 * This file provides backward compatibility with Story 1.3 presets
 * while delegating to the new YAML-based preset system.
 */

// Re-export types from preset module
export type {
  MemorySection,
  PreCommitCheck,
  PreCommitHook,
  HooksConfig,
  MemoryConfig,
  ContextMonitoringConfig,
  PresetDefinition,
  TemplateConfig,
  TemplateFile,
} from '../preset/types.js';

// Import for backward compatibility
import { PresetDefinition } from '../preset/types.js';

/**
 * Backward compatibility: Static preset constants
 * These are maintained for Story 1.3 compatibility.
 * For new code, use the preset registry from ../preset/registry.js
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
 * Backward compatibility: Static preset array
 * For new code, use getRegistry().getAll() instead
 */
export const PRESETS: PresetDefinition[] = [
  minimalPreset,
  webFullstackPreset,
  hackathonPreset,
];
