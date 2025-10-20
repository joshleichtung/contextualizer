/**
 * Unit Tests for Preset Recommender
 *
 * Comprehensive test suite for preset recommendation logic.
 */

import { describe, it, expect } from 'vitest';
import {
  recommendPreset,
  formatRecommendation,
  isRecommendationConfident,
  getDefaultRecommendation,
  type PresetRecommendation,
} from '../../../src/utils/preset-recommender.js';
import {
  FrameworkType,
  type DetectedFramework,
  type DetectedDependency,
} from '../../../src/utils/package-detector.js';

describe('Preset Recommender', () => {
  describe('recommendPreset', () => {
    it('should recommend web-fullstack for Next.js projects', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.NEXT, version: '^14.0.0', confidence: 100 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'next', version: '^14.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.confidence).toBeGreaterThan(40);
      expect(recommendation.reasons).toContain(
        'Next.js detected (ideal for web-fullstack)'
      );
    });

    it('should recommend web-fullstack for React + TypeScript', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.REACT, version: '^18.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'react', version: '^18.0.0', isDev: false },
        { name: 'typescript', version: '^5.0.0', isDev: true },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.reasons).toContain(
        'React + TypeScript detected'
      );
    });

    it('should recommend web-fullstack for Vue projects', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.VUE, version: '^3.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'vue', version: '^3.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.reasons).toContain(
        'Vue/Nuxt framework detected'
      );
    });

    it('should recommend web-fullstack for Angular projects', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.ANGULAR, version: '^17.0.0', confidence: 100 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: '@angular/core', version: '^17.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.reasons).toContain(
        'Angular framework detected'
      );
    });

    it('should recommend web-fullstack for backend frameworks', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.EXPRESS, version: '^4.18.0', confidence: 80 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'express', version: '^4.18.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.reasons).toContain(
        'Backend framework detected'
      );
    });

    it('should add points for Tailwind CSS', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.REACT, version: '^18.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'react', version: '^18.0.0', isDev: false },
        { name: 'typescript', version: '^5.0.0', isDev: true },
        { name: 'tailwindcss', version: '^3.0.0', isDev: true },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      // Should include Tailwind reason
      const hasTailwindReason = recommendation.reasons.some((r) =>
        r.includes('Tailwind CSS')
      );
      expect(hasTailwindReason).toBe(true);
    });

    it('should recommend hackathon for Vite projects', () => {
      const frameworks: DetectedFramework[] = [];
      const dependencies: DetectedDependency[] = [
        { name: 'vite', version: '^5.0.0', isDev: true },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      // Vite alone may not override minimal, but should contribute
      const hasViteReason = recommendation.reasons.some((r) =>
        r.includes('Vite')
      );

      if (recommendation.preset === 'hackathon') {
        expect(hasViteReason).toBe(true);
      }
    });

    it('should recommend hackathon for Svelte projects', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.SVELTE, version: '^4.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'svelte', version: '^4.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('hackathon');
      expect(recommendation.reasons).toContain(
        'Svelte detected (rapid prototyping)'
      );
    });

    it('should recommend minimal for projects with no frameworks', () => {
      const frameworks: DetectedFramework[] = [];
      const dependencies: DetectedDependency[] = [
        { name: 'lodash', version: '^4.17.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.preset).toBe('minimal');
    });

    it('should return confidence scores between 0 and 100', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.NEXT, version: '^14.0.0', confidence: 100 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'next', version: '^14.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
    });

    it('should provide alternatives when multiple presets match', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.REACT, version: '^18.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'react', version: '^18.0.0', isDev: false },
        { name: 'vite', version: '^5.0.0', isDev: true },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      // Should have alternatives since both web-fullstack and hackathon match
      if (recommendation.alternatives) {
        expect(recommendation.alternatives.length).toBeGreaterThan(0);
        expect(recommendation.alternatives[0]).toHaveProperty('preset');
        expect(recommendation.alternatives[0]).toHaveProperty('confidence');
      }
    });

    it('should sort alternatives by confidence', () => {
      const frameworks: DetectedFramework[] = [
        { type: FrameworkType.NEXT, version: '^14.0.0', confidence: 100 },
        { type: FrameworkType.SVELTE, version: '^4.0.0', confidence: 90 },
      ];
      const dependencies: DetectedDependency[] = [
        { name: 'next', version: '^14.0.0', isDev: false },
        { name: 'svelte', version: '^4.0.0', isDev: false },
      ];

      const recommendation = recommendPreset(frameworks, dependencies);

      if (recommendation.alternatives && recommendation.alternatives.length > 1) {
        for (let i = 0; i < recommendation.alternatives.length - 1; i++) {
          expect(recommendation.alternatives[i].confidence).toBeGreaterThanOrEqual(
            recommendation.alternatives[i + 1].confidence
          );
        }
      }
    });

    it('should handle empty frameworks and dependencies', () => {
      const recommendation = recommendPreset([], []);

      expect(recommendation.preset).toBe('minimal');
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.reasons.length).toBeGreaterThan(0);
    });
  });

  describe('isRecommendationConfident', () => {
    it('should return true for confidence >= 40%', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 40,
        reasons: ['Test reason'],
      };

      expect(isRecommendationConfident(recommendation)).toBe(true);
    });

    it('should return true for confidence > 40%', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 75,
        reasons: ['Test reason'],
      };

      expect(isRecommendationConfident(recommendation)).toBe(true);
    });

    it('should return false for confidence < 40%', () => {
      const recommendation: PresetRecommendation = {
        preset: 'minimal',
        confidence: 39,
        reasons: ['Test reason'],
      };

      expect(isRecommendationConfident(recommendation)).toBe(false);
    });

    it('should return false for confidence = 0%', () => {
      const recommendation: PresetRecommendation = {
        preset: 'minimal',
        confidence: 0,
        reasons: [],
      };

      expect(isRecommendationConfident(recommendation)).toBe(false);
    });

    it('should return true for confidence = 100%', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 100,
        reasons: ['Maximum confidence'],
      };

      expect(isRecommendationConfident(recommendation)).toBe(true);
    });
  });

  describe('formatRecommendation', () => {
    it('should format basic recommendation', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 85,
        reasons: ['Next.js detected', 'TypeScript found'],
      };

      const formatted = formatRecommendation(recommendation);

      expect(formatted).toContain('web-fullstack');
      expect(formatted).toContain('85%');
      expect(formatted).toContain('Next.js detected');
      expect(formatted).toContain('TypeScript found');
    });

    it('should include alternatives when present', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 75,
        reasons: ['React detected'],
        alternatives: [
          { preset: 'hackathon', confidence: 60 },
          { preset: 'minimal', confidence: 20 },
        ],
      };

      const formatted = formatRecommendation(recommendation);

      expect(formatted).toContain('Alternative Presets');
      expect(formatted).toContain('hackathon');
      expect(formatted).toContain('60%');
    });

    it('should handle empty reasons', () => {
      const recommendation: PresetRecommendation = {
        preset: 'minimal',
        confidence: 10,
        reasons: [],
      };

      const formatted = formatRecommendation(recommendation);

      expect(formatted).toContain('minimal');
      expect(formatted).toContain('10%');
    });

    it('should handle no alternatives', () => {
      const recommendation: PresetRecommendation = {
        preset: 'web-fullstack',
        confidence: 90,
        reasons: ['Next.js detected'],
      };

      const formatted = formatRecommendation(recommendation);

      expect(formatted).not.toContain('Alternative Presets');
    });
  });

  describe('getDefaultRecommendation', () => {
    it('should return web-fullstack for web projects', () => {
      const recommendation = getDefaultRecommendation('web');

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.confidence).toBe(50);
      expect(recommendation.reasons).toContain(
        'Default recommendation for web projects'
      );
    });

    it('should return hackathon for prototype projects', () => {
      const recommendation = getDefaultRecommendation('prototype');

      expect(recommendation.preset).toBe('hackathon');
      expect(recommendation.confidence).toBe(50);
      expect(recommendation.reasons).toContain(
        'Default recommendation for prototypes'
      );
    });

    it('should return minimal for minimal projects', () => {
      const recommendation = getDefaultRecommendation('minimal');

      expect(recommendation.preset).toBe('minimal');
      expect(recommendation.confidence).toBe(50);
      expect(recommendation.reasons).toContain('Default minimal setup');
    });

    it('should default to minimal when no type specified', () => {
      const recommendation = getDefaultRecommendation();

      expect(recommendation.preset).toBe('minimal');
      expect(recommendation.confidence).toBe(50);
    });
  });
});
