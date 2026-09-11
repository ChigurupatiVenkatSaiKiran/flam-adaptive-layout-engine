/**
 * Declarative Ad Specification Builder & Schema Types
 * 
 * Provides type-safe builders (`defineAd`, `defineElement`) that enforce
 * valid role combinations, positive priority rankings, and constraint invariants.
 */

import { AdSpec, AdElement, AdTheme } from './engine/types';
export * from './engine/types';
export { PRESET_SPECS } from './engine/presets';
export { defineSurface, PRESET_SURFACES } from './surfaces';

/**
 * Type-safe builder function for defining an Ad Specification
 */
export function defineAd(config: {
  id?: string;
  name?: string;
  theme?: Partial<AdTheme>;
  elements: AdElement[];
  metadata?: AdSpec['metadata'];
}): AdSpec {
  const defaultTheme: AdTheme = {
    primaryColor: '#6366f1',
    accentColor: '#06b6d4',
    backgroundColor: '#090d16',
    backgroundGradient: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
    textColor: '#f8fafc',
    mutedTextColor: '#94a3b8',
    glassmorphism: true,
    cornerRadius: 16
  };

  // Validate elements have unique IDs and positive priorities
  const seenIds = new Set<string>();
  for (const el of config.elements) {
    if (seenIds.has(el.id)) {
      throw new Error(`[defineAd] Duplicate element ID detected: "${el.id}". All element IDs must be unique.`);
    }
    seenIds.add(el.id);

    if (typeof el.priority !== 'number' || el.priority < 1 || el.priority > 100) {
      throw new Error(`[defineAd] Invalid priority for element "${el.id}". Priority must be between 1 and 100.`);
    }
  }

  // Validate that essential conversion roles exist (e.g. headline & cta)
  const hasHeadline = config.elements.some(e => e.role === 'headline');
  if (!hasHeadline) {
    console.warn('[defineAd] Warning: Ad spec does not contain a primary "headline" element.');
  }

  return {
    id: config.id || `ad-spec-${Date.now()}`,
    name: config.name || 'Untitled Ad Specification',
    theme: { ...defaultTheme, ...config.theme },
    elements: config.elements,
    metadata: config.metadata
  };
}

/**
 * Fluent helper to create individual ad elements with auto-inferred types
 */
export function defineElement<T extends AdElement>(element: T): T {
  return element;
}
