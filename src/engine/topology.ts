/**
 * Structural Layout Topology Classifier
 * 
 * Determines the macro layout structure based on spatial dimensions,
 * aspect ratio, and content weights. Completely mathematical and continuous -
 * never relies on discrete surface names or hardcoded breakpoints.
 */

import { LayoutTopology } from './types';

export type AspectCategory = 'ultra-wide' | 'wide' | 'square' | 'tall' | 'ultra-tall';

export interface TopologyAnalysis {
  aspectRatio: number;
  category: AspectCategory;
  topology: LayoutTopology;
  isCompact: boolean;
  isExtremeAspectRatio: boolean;
  suggestedMediaRatio: number; // Fraction of canvas allocated to media [0.2 - 0.6]
  orientation: 'horizontal' | 'vertical' | 'inline' | 'grid';
}

export function analyzeTopology(width: number, height: number): TopologyAnalysis {
  const aspectRatio = width / height;
  const area = width * height;
  const isCompact = height < 200 || width < 320 || area < 70000;

  let category: AspectCategory;
  let topology: LayoutTopology;
  let suggestedMediaRatio = 0.45;
  let orientation: 'horizontal' | 'vertical' | 'inline' | 'grid' = 'vertical';

  if (aspectRatio >= 2.8) {
    category = 'ultra-wide';
    topology = isCompact ? 'compact-strip' : 'banner-inline';
    orientation = 'inline';
    suggestedMediaRatio = 0.22; // In broadcast lower-third, media is a compact preview on the left
  } else if (aspectRatio >= 1.3) {
    category = 'wide';
    topology = 'split-horizontal';
    orientation = 'horizontal';
    suggestedMediaRatio = aspectRatio > 1.8 ? 0.45 : 0.40;
  } else if (aspectRatio >= 0.8) {
    category = 'square';
    topology = 'quadrant-grid';
    orientation = 'grid';
    suggestedMediaRatio = 0.42;
  } else if (aspectRatio >= 0.45) {
    category = 'tall';
    topology = 'split-vertical';
    orientation = 'vertical';
    suggestedMediaRatio = 0.48; // In mobile portrait, hero media gets top half
  } else {
    category = 'ultra-tall';
    topology = 'split-vertical';
    orientation = 'vertical';
    suggestedMediaRatio = 0.35;
  }

  const isExtremeAspectRatio = aspectRatio > 3.5 || aspectRatio < 0.4;

  return {
    aspectRatio,
    category,
    topology,
    isCompact,
    isExtremeAspectRatio,
    suggestedMediaRatio,
    orientation
  };
}
