/**
 * Flam Adaptive Layout Engine - Core Constraint Solver
 * 
 * Takes a declarative AdSpec and SurfaceProfile and deterministically resolves
 * all element coordinates, font sizes, scales, and degradation states.
 * 
 * Zero hardcoded surface name branches. Pure mathematical spatial partitioning.
 */

import {
  AdSpec,
  SurfaceProfile,
  ResolvedLayout,
  ResolvedNode,
  LayoutBounds,
  AdElement,
  CtaElement,
  HeadlineElement,
  SubheadElement,
  MediaElement,
  PriceElement,
  RatingElement,
  BrandingElement,
  LegalElement,
  BadgeElement
} from './types';
import { analyzeTopology, TopologyAnalysis } from './topology';
import { computeDegradationPlan, DegradationPlan } from './degradation';
import { textMeasurer } from './text-measurer';

export class ConstraintSolver {
  /**
   * Resolve an ad spec against a surface profile
   */
  public resolve(spec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // 1. Compute usable safe bounds
    const safeBounds: LayoutBounds = {
      x: surface.safeInsets.left,
      y: surface.safeInsets.top,
      width: Math.max(1, surface.width - (surface.safeInsets.left + surface.safeInsets.right)),
      height: Math.max(1, surface.height - (surface.safeInsets.top + surface.safeInsets.bottom))
    };

    if (safeBounds.width <= 0 || safeBounds.height <= 0) {
      throw new Error(`Invalid surface constraints: safe bounds collapsed to width=${safeBounds.width}, height=${safeBounds.height}`);
    }

    // 2. Continuous topology analysis
    const topology = analyzeTopology(safeBounds.width, safeBounds.height);

    // 3. Priority degradation plan
    const degradationPlan = computeDegradationPlan(
      spec,
      surface,
      topology,
      safeBounds.width,
      safeBounds.height
    );

    // 4. Resolve nodes based on topology
    const nodes = this.placeElements(
      spec,
      surface,
      safeBounds,
      topology,
      degradationPlan
    );

    // 5. Verification & Diagnostics
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const resolutionTimeMs = Math.max(0.01, Math.round((endTime - startTime) * 100) / 100);

    const hasCollisions = this.detectCollisions(nodes.filter(n => n.visible));
    const wcagTouchCompliant = this.checkWcagCompliance(nodes, surface);

    const totalBudgetArea = surface.width * surface.height;
    const usableArea = safeBounds.width * safeBounds.height;
    const consumedArea = nodes
      .filter(n => n.visible)
      .reduce((sum, n) => sum + (n.bounds.width * n.bounds.height), 0);

    return {
      specId: spec.id,
      surfaceId: surface.id,
      surfaceWidth: surface.width,
      surfaceHeight: surface.height,
      safeBounds,
      nodes,
      diagnostics: {
        totalBudgetArea,
        usableArea,
        consumedArea,
        aspectRatio: Math.round(topology.aspectRatio * 100) / 100,
        aspectCategory: topology.category,
        topology: topology.topology,
        visibleElementCount: nodes.filter(n => n.visible).length,
        droppedElementCount: degradationPlan.droppedElements.length,
        droppedElementIds: degradationPlan.droppedElements.map(e => e.id),
        degradationLog: degradationPlan.auditLog,
        resolutionTimeMs,
        hasCollisions,
        wcagTouchCompliant
      },
      theme: spec.theme
    };
  }

  private placeElements(
    spec: AdSpec,
    surface: SurfaceProfile,
    safeBounds: LayoutBounds,
    topology: TopologyAnalysis,
    plan: DegradationPlan
  ): ResolvedNode[] {
    const nodes: ResolvedNode[] = [];
    const activeMap = new Map<string, AdElement>();
    plan.retainedElements.forEach(el => activeMap.set(el.id, el));

    // Mark dropped elements as non-visible nodes
    for (const droppedEl of plan.droppedElements) {
      nodes.push({
        id: droppedEl.id,
        role: droppedEl.role,
        element: droppedEl,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        visible: false,
        opacity: 0,
        scale: 0,
        zIndex: 0,
        placementReason: plan.decisions.get(droppedEl.id)?.reason || 'Dropped due to space constraints',
        degradationStage: 'dropped'
      });
    }

    // Branch to layout flow strategy based on mathematical topology
    switch (topology.topology) {
      case 'banner-inline':
      case 'compact-strip':
        this.layoutInlineBanner(spec, surface, safeBounds, plan, nodes);
        break;

      case 'split-horizontal':
        this.layoutSplitHorizontal(spec, surface, safeBounds, plan, nodes);
        break;

      case 'quadrant-grid':
        this.layoutQuadrantGrid(spec, surface, safeBounds, plan, nodes);
        break;

      case 'split-vertical':
      default:
        this.layoutSplitVertical(spec, surface, safeBounds, plan, nodes);
        break;
    }

    return nodes;
  }

  /**
   * Layout Strategy 1: Inline Banner / Lower-Third (Broadcast & Extreme Wide Surfaces)
   */
  private layoutInlineBanner(
    _spec: AdSpec,
    surface: SurfaceProfile,
    bounds: LayoutBounds,
    plan: DegradationPlan,
    nodes: ResolvedNode[]
  ) {
    const padding = Math.max(8, Math.min(16, bounds.height * 0.08));
    const availableHeight = bounds.height - padding * 2;
    let cursorX = bounds.x + padding;
    const rightMargin = bounds.x + bounds.width - padding;

    // 1. Media Thumbnail (Left)
    const media = plan.retainedElements.find(e => e.role === 'media') as MediaElement | undefined;
    if (media) {
      const mediaSize = Math.min(availableHeight, 140);
      nodes.push({
        id: media.id,
        role: 'media',
        element: media,
        bounds: {
          x: cursorX,
          y: bounds.y + padding + (availableHeight - mediaSize) / 2,
          width: mediaSize,
          height: mediaSize
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        placementReason: 'Inline media thumbnail anchor on leading edge',
        degradationStage: 'compact'
      });
      cursorX += mediaSize + padding * 1.5;
    }

    // 2. Branding (if retained)
    const branding = plan.retainedElements.find(e => e.role === 'branding') as BrandingElement | undefined;
    if (branding) {
      const brandWidth = Math.min(130, (bounds.width * 0.15));
      nodes.push({
        id: branding.id,
        role: 'branding',
        element: branding,
        bounds: {
          x: cursorX,
          y: bounds.y + padding,
          width: brandWidth,
          height: availableHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 13),
        placementReason: 'Inline brand identifier',
        degradationStage: 'compact'
      });
      cursorX += brandWidth + padding;
    }

    // Reserve space for CTA on the right side
    const cta = plan.retainedElements.find(e => e.role === 'cta') as CtaElement | undefined;
    let ctaWidth = 0;
    let ctaHeight = 0;
    if (cta) {
      ctaHeight = Math.max(surface.minTapTarget, Math.min(48, availableHeight * 0.8));
      ctaWidth = Math.max(100, Math.min(180, bounds.width * 0.18));
    }

    // Reserve space for Price on right (before CTA)
    const price = plan.retainedElements.find(e => e.role === 'price') as PriceElement | undefined;
    let priceWidth = 0;
    if (price) {
      priceWidth = Math.min(110, bounds.width * 0.12);
    }

    const rightBoundForCopy = rightMargin - (ctaWidth > 0 ? ctaWidth + padding : 0) - (priceWidth > 0 ? priceWidth + padding : 0);
    const copyWidth = Math.max(120, rightBoundForCopy - cursorX);

    // 3. Headline & Subhead (Middle Center)
    const headline = plan.retainedElements.find(e => e.role === 'headline') as HeadlineElement | undefined;
    if (headline) {
      const targetFontSize = Math.max(surface.minTextSize, Math.min(22, availableHeight * 0.28));
      const textMetrics = textMeasurer.measureAndWrapText(
        headline.text,
        copyWidth,
        targetFontSize,
        surface.minTextSize,
        availableHeight > 100 ? 2 : 1
      );

      const headlineY = bounds.y + padding + (availableHeight - textMetrics.totalHeight) / 2;

      nodes.push({
        id: headline.id,
        role: 'headline',
        element: headline,
        bounds: {
          x: cursorX,
          y: headlineY,
          width: copyWidth,
          height: textMetrics.totalHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: textMetrics.fontSize,
        computedLineHeight: textMetrics.lineHeight,
        computedLines: textMetrics.lines,
        isTruncated: textMetrics.isTruncated,
        placementReason: 'Center primary narrative banner text',
        degradationStage: 'original'
      });
    }

    // 4. Price (Right alignment)
    if (price) {
      const priceX = rightMargin - (ctaWidth > 0 ? ctaWidth + padding : 0) - priceWidth;
      nodes.push({
        id: price.id,
        role: 'price',
        element: price,
        bounds: {
          x: priceX,
          y: bounds.y + padding + (availableHeight - 36) / 2,
          width: priceWidth,
          height: 36
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 16),
        placementReason: 'Trailing pricing anchor',
        degradationStage: 'original'
      });
    }

    // 5. CTA Button (Far Right)
    if (cta) {
      const ctaX = rightMargin - ctaWidth;
      const ctaY = bounds.y + padding + (availableHeight - ctaHeight) / 2;
      const tapTarget = this.computeTapTargetBounds({ x: ctaX, y: ctaY, width: ctaWidth, height: ctaHeight }, surface.minTapTarget);

      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: ctaX,
          y: ctaY,
          width: ctaWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 14),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Primary action trigger rightmost anchor',
        degradationStage: 'original'
      });
    }

    // 6. Floating Badge (Overlay on Media)
    const badge = plan.retainedElements.find(e => e.role === 'badge') as BadgeElement | undefined;
    if (badge && media) {
      nodes.push({
        id: badge.id,
        role: 'badge',
        element: badge,
        bounds: {
          x: bounds.x + padding + 4,
          y: bounds.y + padding + 4,
          width: 70,
          height: 20
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 4,
        computedFontSize: Math.max(surface.minTextSize * 0.8, 10),
        placementReason: 'Micro highlight over media preview',
        degradationStage: 'compact'
      });
    }
  }

  /**
   * Layout Strategy 2: Split Horizontal (Landscape 16:9 & Wide Panels)
   */
  private layoutSplitHorizontal(
    _spec: AdSpec,
    surface: SurfaceProfile,
    bounds: LayoutBounds,
    plan: DegradationPlan,
    nodes: ResolvedNode[]
  ) {
    const padding = Math.max(12, Math.min(24, bounds.width * 0.03));
    const columnGap = Math.max(16, Math.min(32, bounds.width * 0.04));
    
    // Left column: 44% width for media
    const leftWidth = Math.floor((bounds.width - padding * 2 - columnGap) * 0.44);
    const rightWidth = bounds.width - padding * 2 - columnGap - leftWidth;
    
    const leftX = bounds.x + padding;
    const rightX = leftX + leftWidth + columnGap;
    const topY = bounds.y + padding;
    const columnHeight = bounds.height - padding * 2;

    // 1. Left Column: Media Visual
    const media = plan.retainedElements.find(e => e.role === 'media') as MediaElement | undefined;
    if (media) {
      nodes.push({
        id: media.id,
        role: 'media',
        element: media,
        bounds: {
          x: leftX,
          y: topY,
          width: leftWidth,
          height: columnHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 1,
        placementReason: 'Hero visual panel occupying left focal column',
        degradationStage: 'original'
      });
    }

    // Badge overlay on media
    const badge = plan.retainedElements.find(e => e.role === 'badge') as BadgeElement | undefined;
    if (badge) {
      nodes.push({
        id: badge.id,
        role: 'badge',
        element: badge,
        bounds: {
          x: leftX + 12,
          y: topY + 12,
          width: 80,
          height: 24
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize * 0.85, 11),
        placementReason: 'Callout badge pinned on hero media',
        degradationStage: 'original'
      });
    }

    // 2. Right Column: Content Stack
    let cursorY = topY;

    // Top: Branding & Rating Header
    const branding = plan.retainedElements.find(e => e.role === 'branding') as BrandingElement | undefined;
    const rating = plan.retainedElements.find(e => e.role === 'rating') as RatingElement | undefined;

    if (branding) {
      const brandHeight = Math.min(32, columnHeight * 0.12);
      nodes.push({
        id: branding.id,
        role: 'branding',
        element: branding,
        bounds: {
          x: rightX,
          y: cursorY,
          width: rating ? rightWidth * 0.6 : rightWidth,
          height: brandHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 14),
        placementReason: 'Brand mark top header',
        degradationStage: 'original'
      });
    }

    if (rating) {
      const ratingX = branding ? rightX + rightWidth * 0.65 : rightX;
      nodes.push({
        id: rating.id,
        role: 'rating',
        element: rating,
        bounds: {
          x: ratingX,
          y: cursorY,
          width: rightWidth * 0.35,
          height: 28
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 12),
        placementReason: 'Social proof score header',
        degradationStage: 'original'
      });
    }

    if (branding || rating) {
      cursorY += 36;
    }

    // Middle: Headline
    const headline = plan.retainedElements.find(e => e.role === 'headline') as HeadlineElement | undefined;
    if (headline) {
      const targetFontSize = Math.max(surface.minTextSize, Math.min(32, columnHeight * 0.14));
      const textMetrics = textMeasurer.measureAndWrapText(
        headline.text,
        rightWidth,
        targetFontSize,
        surface.minTextSize,
        2
      );

      nodes.push({
        id: headline.id,
        role: 'headline',
        element: headline,
        bounds: {
          x: rightX,
          y: cursorY,
          width: rightWidth,
          height: textMetrics.totalHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: textMetrics.fontSize,
        computedLineHeight: textMetrics.lineHeight,
        computedLines: textMetrics.lines,
        isTruncated: textMetrics.isTruncated,
        placementReason: 'Primary value proposition headline',
        degradationStage: 'original'
      });
      cursorY += textMetrics.totalHeight + 10;
    }

    // Subhead (if retained)
    const subhead = plan.retainedElements.find(e => e.role === 'subhead') as SubheadElement | undefined;
    if (subhead) {
      const subheadFontSize = Math.max(surface.minTextSize, Math.min(15, columnHeight * 0.08));
      const subheadMetrics = textMeasurer.measureAndWrapText(
        subhead.text,
        rightWidth,
        subheadFontSize,
        surface.minTextSize,
        2
      );

      nodes.push({
        id: subhead.id,
        role: 'subhead',
        element: subhead,
        bounds: {
          x: rightX,
          y: cursorY,
          width: rightWidth,
          height: subheadMetrics.totalHeight
        },
        visible: true,
        opacity: 0.9,
        scale: 1,
        zIndex: 2,
        computedFontSize: subheadMetrics.fontSize,
        computedLineHeight: subheadMetrics.lineHeight,
        computedLines: subheadMetrics.lines,
        isTruncated: subheadMetrics.isTruncated,
        placementReason: 'Contextual sub-copy description',
        degradationStage: 'original'
      });
    }

    // Bottom Action Row (Price + CTA)
    const price = plan.retainedElements.find(e => e.role === 'price') as PriceElement | undefined;
    const cta = plan.retainedElements.find(e => e.role === 'cta') as CtaElement | undefined;
    const legal = plan.retainedElements.find(e => e.role === 'legal') as LegalElement | undefined;

    const bottomY = topY + columnHeight;
    const ctaHeight = Math.max(surface.minTapTarget, Math.min(52, columnHeight * 0.18));
    const legalHeight = legal ? 16 : 0;
    const actionRowY = bottomY - ctaHeight - legalHeight - 6;

    if (price && cta) {
      const priceWidth = Math.floor(rightWidth * 0.38);
      const ctaWidth = rightWidth - priceWidth - 12;

      nodes.push({
        id: price.id,
        role: 'price',
        element: price,
        bounds: {
          x: rightX,
          y: actionRowY,
          width: priceWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 18),
        placementReason: 'Price tag aligned with action CTA',
        degradationStage: 'original'
      });

      const ctaX = rightX + priceWidth + 12;
      const tapTarget = this.computeTapTargetBounds({ x: ctaX, y: actionRowY, width: ctaWidth, height: ctaHeight }, surface.minTapTarget);
      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: ctaX,
          y: actionRowY,
          width: ctaWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 15),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Prominent interactive CTA button',
        degradationStage: 'original'
      });
    } else if (cta) {
      const tapTarget = this.computeTapTargetBounds({ x: rightX, y: actionRowY, width: rightWidth, height: ctaHeight }, surface.minTapTarget);
      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: rightX,
          y: actionRowY,
          width: rightWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 15),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Full-width action CTA button',
        degradationStage: 'original'
      });
    }

    // Legal disclaimer at very bottom
    if (legal) {
      nodes.push({
        id: legal.id,
        role: 'legal',
        element: legal,
        bounds: {
          x: rightX,
          y: bottomY - legalHeight,
          width: rightWidth,
          height: legalHeight
        },
        visible: true,
        opacity: 0.6,
        scale: 1,
        zIndex: 1,
        computedFontSize: Math.max(surface.minTextSize * 0.75, 9),
        placementReason: 'Footer disclaimer microcopy',
        degradationStage: 'compact'
      });
    }
  }

  /**
   * Layout Strategy 3: Split Vertical (Mobile Portrait 9:16 & Tall Cards)
   */
  private layoutSplitVertical(
    _spec: AdSpec,
    surface: SurfaceProfile,
    bounds: LayoutBounds,
    plan: DegradationPlan,
    nodes: ResolvedNode[]
  ) {
    const padding = Math.max(12, Math.min(24, bounds.width * 0.05));
    const contentWidth = bounds.width - padding * 2;
    let cursorY = bounds.y + padding;
    const contentX = bounds.x + padding;

    // 1. Top Header Row (Brand + Badge)
    const branding = plan.retainedElements.find(e => e.role === 'branding') as BrandingElement | undefined;
    const badge = plan.retainedElements.find(e => e.role === 'badge') as BadgeElement | undefined;

    if (branding || badge) {
      const headerHeight = Math.min(36, bounds.height * 0.06);
      if (branding) {
        nodes.push({
          id: branding.id,
          role: 'branding',
          element: branding,
          bounds: {
            x: contentX,
            y: cursorY,
            width: badge ? contentWidth * 0.65 : contentWidth,
            height: headerHeight
          },
          visible: true,
          opacity: 1,
          scale: 1,
          zIndex: 2,
          computedFontSize: Math.max(surface.minTextSize, 14),
          placementReason: 'Top masthead brand logo & identity',
          degradationStage: 'original'
        });
      }

      if (badge) {
        const badgeWidth = 84;
        nodes.push({
          id: badge.id,
          role: 'badge',
          element: badge,
          bounds: {
            x: contentX + contentWidth - badgeWidth,
            y: cursorY + (headerHeight - 24) / 2,
            width: badgeWidth,
            height: 24
          },
          visible: true,
          opacity: 1,
          scale: 1,
          zIndex: 2,
          computedFontSize: Math.max(surface.minTextSize * 0.85, 11),
          placementReason: 'Highlight pill badge in top right masthead',
          degradationStage: 'original'
        });
      }
      cursorY += headerHeight + 12;
    }

    // 2. Hero Media Section (Takes ~40-48% of vertical budget)
    const media = plan.retainedElements.find(e => e.role === 'media') as MediaElement | undefined;
    if (media) {
      const mediaHeight = Math.floor(bounds.height * (bounds.height > 600 ? 0.44 : 0.38));
      nodes.push({
        id: media.id,
        role: 'media',
        element: media,
        bounds: {
          x: contentX,
          y: cursorY,
          width: contentWidth,
          height: mediaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 1,
        placementReason: 'High-impact central hero visual showcase',
        degradationStage: 'original'
      });
      cursorY += mediaHeight + 16;
    }

    // 3. Social Proof Rating (if retained)
    const rating = plan.retainedElements.find(e => e.role === 'rating') as RatingElement | undefined;
    if (rating) {
      nodes.push({
        id: rating.id,
        role: 'rating',
        element: rating,
        bounds: {
          x: contentX,
          y: cursorY,
          width: contentWidth,
          height: 22
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 13),
        placementReason: 'Social proof star rating under hero media',
        degradationStage: 'original'
      });
      cursorY += 26;
    }

    // 4. Headline
    const headline = plan.retainedElements.find(e => e.role === 'headline') as HeadlineElement | undefined;
    if (headline) {
      const targetFontSize = Math.max(surface.minTextSize, Math.min(28, bounds.width * 0.075));
      const textMetrics = textMeasurer.measureAndWrapText(
        headline.text,
        contentWidth,
        targetFontSize,
        surface.minTextSize,
        2
      );

      nodes.push({
        id: headline.id,
        role: 'headline',
        element: headline,
        bounds: {
          x: contentX,
          y: cursorY,
          width: contentWidth,
          height: textMetrics.totalHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: textMetrics.fontSize,
        computedLineHeight: textMetrics.lineHeight,
        computedLines: textMetrics.lines,
        isTruncated: textMetrics.isTruncated,
        placementReason: 'Primary conversion headline',
        degradationStage: 'original'
      });
      cursorY += textMetrics.totalHeight + 8;
    }

    // 5. Subhead
    const subhead = plan.retainedElements.find(e => e.role === 'subhead') as SubheadElement | undefined;
    if (subhead) {
      const subheadFontSize = Math.max(surface.minTextSize, Math.min(15, bounds.width * 0.04));
      const subheadMetrics = textMeasurer.measureAndWrapText(
        subhead.text,
        contentWidth,
        subheadFontSize,
        surface.minTextSize,
        2
      );

      nodes.push({
        id: subhead.id,
        role: 'subhead',
        element: subhead,
        bounds: {
          x: contentX,
          y: cursorY,
          width: contentWidth,
          height: subheadMetrics.totalHeight
        },
        visible: true,
        opacity: 0.85,
        scale: 1,
        zIndex: 2,
        computedFontSize: subheadMetrics.fontSize,
        computedLineHeight: subheadMetrics.lineHeight,
        computedLines: subheadMetrics.lines,
        isTruncated: subheadMetrics.isTruncated,
        placementReason: 'Supporting feature elaboration copy',
        degradationStage: 'original'
      });
    }

    // 6. Bottom Anchored Elements: Price & CTA
    const price = plan.retainedElements.find(e => e.role === 'price') as PriceElement | undefined;
    const cta = plan.retainedElements.find(e => e.role === 'cta') as CtaElement | undefined;
    const legal = plan.retainedElements.find(e => e.role === 'legal') as LegalElement | undefined;

    const bottomY = bounds.y + bounds.height - padding;
    const legalHeight = legal ? 16 : 0;
    const ctaHeight = Math.max(surface.minTapTarget, Math.min(54, bounds.height * 0.08));

    if (legal) {
      nodes.push({
        id: legal.id,
        role: 'legal',
        element: legal,
        bounds: {
          x: contentX,
          y: bottomY - legalHeight,
          width: contentWidth,
          height: legalHeight
        },
        visible: true,
        opacity: 0.6,
        scale: 1,
        zIndex: 1,
        computedFontSize: Math.max(surface.minTextSize * 0.75, 9),
        placementReason: 'Bottom legal terms notice',
        degradationStage: 'compact'
      });
    }

    const ctaY = bottomY - legalHeight - ctaHeight - (legal ? 8 : 0);

    if (price && cta) {
      // Split bottom action row into Price on left, CTA on right
      const priceWidth = Math.floor(contentWidth * 0.35);
      const ctaWidth = contentWidth - priceWidth - 12;

      nodes.push({
        id: price.id,
        role: 'price',
        element: price,
        bounds: {
          x: contentX,
          y: ctaY,
          width: priceWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 18),
        placementReason: 'Prominent price block side-by-side with CTA',
        degradationStage: 'original'
      });

      const ctaX = contentX + priceWidth + 12;
      const tapTarget = this.computeTapTargetBounds({ x: ctaX, y: ctaY, width: ctaWidth, height: ctaHeight }, surface.minTapTarget);

      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: ctaX,
          y: ctaY,
          width: ctaWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 16),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Thumb-accessible primary touch conversion CTA',
        degradationStage: 'original'
      });
    } else if (cta) {
      // Full-width CTA
      const tapTarget = this.computeTapTargetBounds({ x: contentX, y: ctaY, width: contentWidth, height: ctaHeight }, surface.minTapTarget);

      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: contentX,
          y: ctaY,
          width: contentWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 16),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Full-width bottom thumb action CTA',
        degradationStage: 'original'
      });
    }
  }

  /**
   * Layout Strategy 4: Quadrant Grid (Square Retail Kiosk 1:1)
   */
  private layoutQuadrantGrid(
    _spec: AdSpec,
    surface: SurfaceProfile,
    bounds: LayoutBounds,
    plan: DegradationPlan,
    nodes: ResolvedNode[]
  ) {
    const padding = Math.max(16, Math.min(32, bounds.width * 0.04));
    const contentWidth = bounds.width - padding * 2;
    const contentHeight = bounds.height - padding * 2;
    const contentX = bounds.x + padding;
    const contentY = bounds.y + padding;

    // Top half: Hero Media visual with overlay branding/badge
    const topHalfHeight = Math.floor(contentHeight * 0.48);
    const media = plan.retainedElements.find(e => e.role === 'media') as MediaElement | undefined;
    if (media) {
      nodes.push({
        id: media.id,
        role: 'media',
        element: media,
        bounds: {
          x: contentX,
          y: contentY,
          width: contentWidth,
          height: topHalfHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 1,
        placementReason: 'Top quadrant hero spatial display showcase',
        degradationStage: 'original'
      });
    }

    // Top Right Badge / Brand
    const badge = plan.retainedElements.find(e => e.role === 'badge') as BadgeElement | undefined;
    if (badge) {
      nodes.push({
        id: badge.id,
        role: 'badge',
        element: badge,
        bounds: {
          x: contentX + contentWidth - 90,
          y: contentY + 12,
          width: 80,
          height: 26
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize * 0.85, 11),
        placementReason: 'Badge floating in top corner',
        degradationStage: 'original'
      });
    }

    const branding = plan.retainedElements.find(e => e.role === 'branding') as BrandingElement | undefined;
    if (branding) {
      nodes.push({
        id: branding.id,
        role: 'branding',
        element: branding,
        bounds: {
          x: contentX + 12,
          y: contentY + 12,
          width: 140,
          height: 30
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 14),
        placementReason: 'Floating branding stamp',
        degradationStage: 'original'
      });
    }

    // Bottom half: Left is narrative (Headline/Subhead), Right is Transaction (Price/CTA)
    const bottomY = contentY + topHalfHeight + 16;
    const bottomHeight = contentHeight - topHalfHeight - 16;
    const colWidth = (contentWidth - 16) / 2;

    // Bottom Left: Headline & Subhead
    let leftCursorY = bottomY;
    const headline = plan.retainedElements.find(e => e.role === 'headline') as HeadlineElement | undefined;
    if (headline) {
      const targetFontSize = Math.max(surface.minTextSize, Math.min(26, bounds.width * 0.045));
      const textMetrics = textMeasurer.measureAndWrapText(
        headline.text,
        colWidth,
        targetFontSize,
        surface.minTextSize,
        3
      );

      nodes.push({
        id: headline.id,
        role: 'headline',
        element: headline,
        bounds: {
          x: contentX,
          y: leftCursorY,
          width: colWidth,
          height: textMetrics.totalHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: textMetrics.fontSize,
        computedLineHeight: textMetrics.lineHeight,
        computedLines: textMetrics.lines,
        isTruncated: textMetrics.isTruncated,
        placementReason: 'Kiosk left-quadrant headline focus',
        degradationStage: 'original'
      });
      leftCursorY += textMetrics.totalHeight + 8;
    }

    const subhead = plan.retainedElements.find(e => e.role === 'subhead') as SubheadElement | undefined;
    if (subhead && leftCursorY + 30 < contentY + contentHeight) {
      const subheadFontSize = Math.max(surface.minTextSize, 13);
      const subheadMetrics = textMeasurer.measureAndWrapText(
        subhead.text,
        colWidth,
        subheadFontSize,
        surface.minTextSize,
        2
      );

      nodes.push({
        id: subhead.id,
        role: 'subhead',
        element: subhead,
        bounds: {
          x: contentX,
          y: leftCursorY,
          width: colWidth,
          height: subheadMetrics.totalHeight
        },
        visible: true,
        opacity: 0.85,
        scale: 1,
        zIndex: 2,
        computedFontSize: subheadMetrics.fontSize,
        computedLineHeight: subheadMetrics.lineHeight,
        computedLines: subheadMetrics.lines,
        isTruncated: subheadMetrics.isTruncated,
        placementReason: 'Kiosk left-quadrant supporting copy',
        degradationStage: 'original'
      });
    }

    // Bottom Right: Price & Big Touch CTA
    const rightColX = contentX + colWidth + 16;
    const price = plan.retainedElements.find(e => e.role === 'price') as PriceElement | undefined;
    const cta = plan.retainedElements.find(e => e.role === 'cta') as CtaElement | undefined;

    if (price) {
      nodes.push({
        id: price.id,
        role: 'price',
        element: price,
        bounds: {
          x: rightColX,
          y: bottomY,
          width: colWidth,
          height: 44
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 2,
        computedFontSize: Math.max(surface.minTextSize, 22),
        placementReason: 'Large kiosk price block',
        degradationStage: 'original'
      });
    }

    if (cta) {
      const ctaY = bottomY + (price ? 52 : 0);
      const ctaHeight = Math.max(surface.minTapTarget, Math.min(60, bottomHeight - (price ? 56 : 0)));
      const tapTarget = this.computeTapTargetBounds({ x: rightColX, y: ctaY, width: colWidth, height: ctaHeight }, surface.minTapTarget);

      nodes.push({
        id: cta.id,
        role: 'cta',
        element: cta,
        bounds: {
          x: rightColX,
          y: ctaY,
          width: colWidth,
          height: ctaHeight
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 17),
        tapTargetBounds: tapTarget,
        isTapTargetCompliant: true,
        placementReason: 'Large kiosk touch target CTA button',
        degradationStage: 'original'
      });
    }

    // Rating (if retained)
    const rating = plan.retainedElements.find(e => e.role === 'rating') as RatingElement | undefined;
    if (rating) {
      nodes.push({
        id: rating.id,
        role: 'rating',
        element: rating,
        bounds: {
          x: contentX,
          y: contentY + topHalfHeight - 32,
          width: 120,
          height: 24
        },
        visible: true,
        opacity: 1,
        scale: 1,
        zIndex: 3,
        computedFontSize: Math.max(surface.minTextSize, 12),
        placementReason: 'Rating badge over hero preview bottom left',
        degradationStage: 'compact'
      });
    }
  }

  private computeTapTargetBounds(bounds: LayoutBounds, minTapTarget: number): LayoutBounds {
    const padW = Math.max(0, (minTapTarget - bounds.width) / 2);
    const padH = Math.max(0, (minTapTarget - bounds.height) / 2);
    return {
      x: bounds.x - padW,
      y: bounds.y - padH,
      width: Math.max(bounds.width, minTapTarget),
      height: Math.max(bounds.height, minTapTarget)
    };
  }

  private detectCollisions(nodes: ResolvedNode[]): boolean {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        // Badges and floating brand marks are allowed to sit on media (different zIndex)
        if (a.zIndex !== b.zIndex) continue;

        const overlaps = (
          a.bounds.x < b.bounds.x + b.bounds.width &&
          a.bounds.x + a.bounds.width > b.bounds.x &&
          a.bounds.y < b.bounds.y + b.bounds.height &&
          a.bounds.y + a.bounds.height > b.bounds.y
        );

        if (overlaps) {
          return true;
        }
      }
    }
    return false;
  }

  private checkWcagCompliance(nodes: ResolvedNode[], surface: SurfaceProfile): boolean {
    if (surface.interactionMode !== 'touch' && surface.interactionMode !== 'kiosk_touch') {
      return true; // Not a touch surface
    }

    const interactiveNodes = nodes.filter(n => n.visible && n.role === 'cta');
    return interactiveNodes.every(n => {
      const target = n.tapTargetBounds || n.bounds;
      return target.width >= surface.minTapTarget && target.height >= surface.minTapTarget;
    });
  }
}

export const constraintSolver = new ConstraintSolver();
