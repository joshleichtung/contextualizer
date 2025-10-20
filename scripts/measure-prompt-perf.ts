/**
 * Performance measurement for prompts
 */

import { setupWizardPrompt } from '../src/prompts/setup-wizard.js';
import { healthCheckPrompt } from '../src/prompts/health-check.js';
import { optimizeContextPrompt } from '../src/prompts/optimize-context.js';

async function measurePerformance() {
  console.log('Measuring prompt execution performance...\n');

  // Warm up
  await setupWizardPrompt.provider({});

  // Measure setup_wizard
  const start1 = performance.now();
  for (let i = 0; i < 100; i++) {
    await setupWizardPrompt.provider({ project_type: 'nextjs' });
  }
  const end1 = performance.now();
  const avg1 = (end1 - start1) / 100;

  // Measure health_check
  const start2 = performance.now();
  for (let i = 0; i < 100; i++) {
    await healthCheckPrompt.provider({});
  }
  const end2 = performance.now();
  const avg2 = (end2 - start2) / 100;

  // Measure optimize_context
  const start3 = performance.now();
  for (let i = 0; i < 100; i++) {
    await optimizeContextPrompt.provider({ strategy: 'aggressive' });
  }
  const end3 = performance.now();
  const avg3 = (end3 - start3) / 100;

  console.log('Performance Results (average over 100 runs):');
  console.log(`setup_wizard:      ${avg1.toFixed(3)} ms`);
  console.log(`health_check:      ${avg2.toFixed(3)} ms`);
  console.log(`optimize_context:  ${avg3.toFixed(3)} ms`);
  console.log('');
  console.log('Target: < 10ms for provider execution');
  console.log(
    'All prompts:',
    avg1 < 10 && avg2 < 10 && avg3 < 10 ? '✅ PASS' : '❌ FAIL',
  );
}

measurePerformance();
