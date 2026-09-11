/**
 * Priority Degradation & Capacity Planning Cascade
 * 
 * Determines which elements must be retained, compacted, scaled down, or dropped
 * based on element priority scores (1-100), min bounds, and surface spatial budgets.
 * Produces an audit log explaining every drop/scale decision.
 */

import { AdElement, AdSpec, SurfaceProfile, ElementRole } from './types';
import { TopologyAnalysis } from './topology';

export interface DegradationDecision {
  element: AdElement;
  status: 'retained_full' | 'scaled_down' | 'compacted' | 'dropped';
  reason: string;
  allocatedAreaBudget: number;
}

export interface DegradationPlan {
  retainedElements: AdElement[];
  droppedElements: AdElement[];
  decisions: Map<string, DegradationDecision>;
  auditLog: {
    elementId: string;
    role: ElementRole;
    action: 'retained_full' | 'scaled_down' | 'compacted' | 'dropped';
    reason: string;
  }[];
}

export function computeDegradationPlan(
  spec: AdSpec,
  surface: SurfaceProfile,
  topology: TopologyAnalysis,
  usableWidth: number,
  usableHeight: number
): DegradationPlan {
  const usableArea = usableWidth * usableHeight;
  const decisions = new Map<string, DegradationDecision>();
  const auditLog: DegradationPlan['auditLog'] = [];

  // Sort elements by priority DESCENDING (highest priority first)
  const sortedElements = [...spec.elements].sort((a, b) => b.priority - a.priority);

  // Dynamic capacity rules based on aspect category & physical dimensions
  let maxAllowedElements = surface.maxElements ?? 999;
  
  if (topology.category === 'ultra-wide' && usableHeight < 220) {
    // Ultra-wide lower-third has strict horizontal strip limit
    maxAllowedElements = Math.min(maxAllowedElements, 5);
  } else if (usableHeight < 180 || usableWidth < 280) {
    // Extremely small nano canvas
    maxAllowedElements = Math.min(maxAllowedElements, 3);
  } else if (usableHeight < 320 || usableWidth < 360) {
    // Compact canvas
    maxAllowedElements = Math.min(maxAllowedElements, 5);
  }

  // Minimum required area estimation per element role
  const getMinAreaRequirement = (el: AdElement): number => {
    switch (el.role) {
      case 'media':
        return topology.category === 'ultra-wide' ? 4000 : 25000;
      case 'headline':
        return 6000;
      case 'cta':
        return Math.max(surface.minTapTarget * surface.minTapTarget, 4000);
      case 'price':
        return 2500;
      case 'subhead':
        return 4000;
      case 'branding':
        return 3000;
      case 'rating':
        return 2000;
      case 'badge':
        return 1500;
      case 'legal':
        return 2000;
      default:
        return 2000;
    }
  };

  let cumulativeMinArea = 0;
  let retainedCount = 0;
  const retainedElements: AdElement[] = [];
  const droppedElements: AdElement[] = [];

  // Evaluate each element in priority order
  for (const el of sortedElements) {
    const requiredMinArea = getMinAreaRequirement(el);
    const dropThresholdArea = el.dropThreshold ? (usableArea * el.dropThreshold) / 100 : 0;
    const isExceedingElementCap = retainedCount >= maxAllowedElements;
    const isExceedingAreaBudget = cumulativeMinArea + requiredMinArea > usableArea * 0.95;
    const isBelowExplicitThreshold = usableArea < dropThresholdArea;

    // Critical elements (priority >= 90 like Headline & CTA) are defended with highest urgency
    const isCritical = el.priority >= 90;

    if (!isCritical && (isExceedingElementCap || isExceedingAreaBudget || isBelowExplicitThreshold)) {
      // Must drop element due to spatial constraint
      let reason = 'Insufficient canvas area for element role.';
      if (isExceedingElementCap) {
        reason = `Surface element cap (${maxAllowedElements}) reached for this aspect ratio.`;
      } else if (isBelowExplicitThreshold) {
        reason = `Surface area (${usableArea}px²) below element drop threshold.`;
      }

      decisions.set(el.id, {
        element: el,
        status: 'dropped',
        reason,
        allocatedAreaBudget: 0
      });

      auditLog.push({
        elementId: el.id,
        role: el.role,
        action: 'dropped',
        reason
      });

      droppedElements.push(el);
    } else {
      // Element is retained! Check if it needs compaction or scaling
      retainedCount++;
      cumulativeMinArea += requiredMinArea;

      let status: 'retained_full' | 'scaled_down' | 'compacted' = 'retained_full';
      let reason = 'Retained at full fidelity.';

      if (topology.isCompact || usableHeight < 350) {
        if (el.role === 'subhead' || el.role === 'branding' || el.role === 'rating') {
          status = 'compacted';
          reason = 'Compacted representation chosen to preserve headline and CTA hierarchy.';
        } else if (el.role === 'media') {
          status = 'scaled_down';
          reason = 'Media scale adjusted to respect typography and CTA bounds.';
        }
      }

      decisions.set(el.id, {
        element: el,
        status,
        reason,
        allocatedAreaBudget: requiredMinArea
      });

      auditLog.push({
        elementId: el.id,
        role: el.role,
        action: status,
        reason
      });

      retainedElements.push(el);
    }
  }

  return {
    retainedElements,
    droppedElements,
    decisions,
    auditLog
  };
}
