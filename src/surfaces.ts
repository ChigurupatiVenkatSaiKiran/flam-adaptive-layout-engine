/**
 * Multi-Surface Profile Definitions & Physical Constraint Models
 * 
 * Defines physical surface constraints (dimensions, safe insets, viewing distance,
 * interaction mode, minimum tap targets, and minimum legible text sizes).
 */

import { SurfaceProfile, ViewingDistance, InteractionMode, Insets } from './engine/types';
export * from './engine/types';
export { PRESET_SURFACES } from './engine/presets';

/**
 * Type-safe builder function for defining a Surface Profile
 */
export function defineSurface(config: {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  dpr?: number;
  viewingDistance?: ViewingDistance;
  interactionMode?: InteractionMode;
  safeInsets?: Partial<Insets>;
  minTapTarget?: number;
  minTextSize?: number;
  maxElements?: number;
  targetFps?: number;
}): SurfaceProfile {
  const isTouch = config.interactionMode === 'touch' || config.interactionMode === 'kiosk_touch' || !config.interactionMode;
  const viewingDistance = config.viewingDistance || 'near';

  // Compute sensible defaults if not explicitly passed
  let defaultMinTextSize = 12;
  if (viewingDistance === 'far') defaultMinTextSize = 18;
  else if (viewingDistance === 'medium') defaultMinTextSize = 14;

  const defaultMinTapTarget = isTouch ? 44 : 0;

  return {
    id: config.id,
    name: config.name,
    description: config.description || `${config.width}x${config.height} (${viewingDistance} viewing distance)`,
    width: Math.max(1, config.width),
    height: Math.max(1, config.height),
    dpr: config.dpr || 2,
    viewingDistance,
    interactionMode: config.interactionMode || 'touch',
    safeInsets: {
      top: config.safeInsets?.top ?? 0,
      right: config.safeInsets?.right ?? 0,
      bottom: config.safeInsets?.bottom ?? 0,
      left: config.safeInsets?.left ?? 0
    },
    minTapTarget: config.minTapTarget ?? defaultMinTapTarget,
    minTextSize: config.minTextSize ?? defaultMinTextSize,
    maxElements: config.maxElements,
    targetFps: config.targetFps ?? 60
  };
}
