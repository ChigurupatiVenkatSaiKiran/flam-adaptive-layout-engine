import { describe, it, expect } from 'vitest';
import { resolveLayout } from '../resolver';
import { PRESET_SPECS, PRESET_SURFACES } from '../engine/presets';
import { defineSurface } from '../spec';

describe('Flam Adaptive Layout Engine - Constraint Resolution Suite', () => {
  const spec = PRESET_SPECS[0]; // Flam Prism XR spec

  it('1. Resolves all 4 required surfaces without throwing errors or negative bounds', () => {
    for (const surface of PRESET_SURFACES) {
      const layout = resolveLayout(spec, surface);

      expect(layout.nodes.length).toBeGreaterThan(0);
      expect(layout.safeBounds.width).toBeGreaterThan(0);
      expect(layout.safeBounds.height).toBeGreaterThan(0);

      const visibleNodes = layout.nodes.filter(n => n.visible);
      expect(visibleNodes.length).toBeGreaterThanOrEqual(2); // At minimum headline + CTA

      for (const node of visibleNodes) {
        expect(node.bounds.width).toBeGreaterThan(0);
        expect(node.bounds.height).toBeGreaterThan(0);
        expect(node.bounds.x).toBeGreaterThanOrEqual(surface.safeInsets.left - 1);
        expect(node.bounds.y).toBeGreaterThanOrEqual(surface.safeInsets.top - 1);
      }
    }
  });

  it('2. Guarantees Zero Element Collisions (No Overlaps) across all preset surfaces', () => {
    for (const surface of PRESET_SURFACES) {
      const layout = resolveLayout(spec, surface);
      expect(layout.diagnostics.hasCollisions).toBe(false);
    }
  });

  it('3. Enforces Deterministic Priority Degradation when space is constrained', () => {
    const nanoSurface = PRESET_SURFACES.find(s => s.id === 'nano-micro-ad')!;
    const layout = resolveLayout(spec, nanoSurface);

    // Verify low-priority elements are dropped first
    const droppedRoles = layout.nodes.filter(n => !n.visible).map(n => n.role);
    const visibleRoles = layout.nodes.filter(n => n.visible).map(n => n.role);

    // Headline (P:95) and CTA (P:100) must survive
    expect(visibleRoles).toContain('headline');
    expect(visibleRoles).toContain('cta');

    // Legal (P:15) and Branding (P:35) must drop before headline
    expect(droppedRoles).toContain('legal');
  });

  it('4. Enforces WCAG 2.5.5 Touch Target Minimum Bounding Boxes (>=44px) on touch surfaces', () => {
    const touchSurfaces = PRESET_SURFACES.filter(s => s.interactionMode.includes('touch'));

    for (const surface of touchSurfaces) {
      const layout = resolveLayout(spec, surface);
      const ctaNode = layout.nodes.find(n => n.role === 'cta' && n.visible);

      expect(ctaNode).toBeDefined();
      const tapTarget = ctaNode!.tapTargetBounds || ctaNode!.bounds;
      expect(tapTarget.width).toBeGreaterThanOrEqual(surface.minTapTarget);
      expect(tapTarget.height).toBeGreaterThanOrEqual(surface.minTapTarget);
      expect(layout.diagnostics.wcagTouchCompliant).toBe(true);
    }
  });

  it('5. Enforces Broadcast Far-Viewing Distance Minimum Typography (>=18px)', () => {
    const broadcastSurface = PRESET_SURFACES.find(s => s.id === 'broadcast-lower-third')!;
    const layout = resolveLayout(spec, broadcastSurface);

    const headlineNode = layout.nodes.find(n => n.role === 'headline' && n.visible);
    expect(headlineNode).toBeDefined();
    expect(headlineNode!.computedFontSize).toBeGreaterThanOrEqual(broadcastSurface.minTextSize);
  });

  it('6. Successfully resolves 20 random arbitrary unseen aspect ratios (5th Surface Interview Test)', () => {
    for (let i = 0; i < 20; i++) {
      const randomWidth = Math.floor(Math.random() * 1000) + 300;
      const randomHeight = Math.floor(Math.random() * 800) + 150;

      const dynamicSurface = defineSurface({
        id: `random-surface-${i}`,
        name: `Dynamic ${randomWidth}x${randomHeight}`,
        width: randomWidth,
        height: randomHeight,
        viewingDistance: 'near',
        interactionMode: 'touch',
        minTapTarget: 44,
        minTextSize: 12
      });

      const layout = resolveLayout(spec, dynamicSurface);
      expect(layout.diagnostics.hasCollisions).toBe(false);
      expect(layout.nodes.filter(n => n.visible).length).toBeGreaterThanOrEqual(2);
    }
  });
});
