/**
 * Standalone HTML5 Canvas 2D Rendering Backend
 * 
 * Draws the exact same ResolvedLayout AST onto an HTML5 Canvas context.
 * Proves total renderer independence from the constraint resolution algorithm.
 */

import { ResolvedLayout, ResolvedNode } from '../../engine/types';

export function renderLayoutToCanvas(
  ctx: CanvasRenderingContext2D,
  layout: ResolvedLayout,
  options: {
    showDebug?: boolean;
    showSafeAreas?: boolean;
    showTapTargets?: boolean;
    dpr?: number;
  } = {}
) {
  const { surfaceWidth, surfaceHeight, safeBounds, nodes, theme } = layout;
  const dpr = options.dpr || 1;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, surfaceWidth, surfaceHeight);

  // 1. Background Fill / Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, surfaceWidth, surfaceHeight);
  bgGradient.addColorStop(0, '#090d16');
  bgGradient.addColorStop(0.5, '#0f172a');
  bgGradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGradient;

  // Draw rounded card background
  drawRoundedRect(ctx, 0, 0, surfaceWidth, surfaceHeight, theme.cornerRadius || 16);
  ctx.fill();

  // Subtle corner border stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Safe Area Guides (if enabled)
  if (options.showSafeAreas) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)'; // Amber dashed
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(safeBounds.x, safeBounds.y, safeBounds.width, safeBounds.height);
    ctx.setLineDash([]);
  }

  // 3. Draw Nodes (sorted by zIndex)
  const activeNodes = nodes.filter(n => n.visible).sort((a, b) => a.zIndex - b.zIndex);

  for (const node of activeNodes) {
    drawNode(ctx, node, layout, options);
  }

  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: ResolvedNode,
  layout: ResolvedLayout,
  options: { showDebug?: boolean; showTapTargets?: boolean }
) {
  const { bounds, role, element, computedFontSize, computedLines } = node;
  const theme = layout.theme;

  ctx.save();

  switch (role) {
    case 'media': {
      // Draw media placeholder / background plate with glow
      ctx.fillStyle = '#1e293b';
      drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 12);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw subtle grid texture / icon inside media box
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.beginPath();
      ctx.arc(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, Math.min(bounds.width, bounds.height) * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ 3D Spatial Visual', bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      break;
    }

    case 'headline': {
      ctx.fillStyle = '#ffffff';
      const fontSize = computedFontSize || 22;
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const lines = computedLines && computedLines.length > 0 ? computedLines : [(element as any).text];
      const lineHeight = fontSize * 1.25;

      lines.forEach((line, idx) => {
        ctx.fillText(line, bounds.x, bounds.y + idx * lineHeight);
      });
      break;
    }

    case 'subhead': {
      ctx.fillStyle = '#94a3b8';
      const fontSize = computedFontSize || 14;
      ctx.font = `400 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const lines = computedLines && computedLines.length > 0 ? computedLines : [(element as any).text];
      const lineHeight = fontSize * 1.25;

      lines.forEach((line, idx) => {
        ctx.fillText(line, bounds.x, bounds.y + idx * lineHeight);
      });
      break;
    }

    case 'branding': {
      // Draw Brand Logo Badge
      ctx.fillStyle = theme.primaryColor;
      drawRoundedRect(ctx, bounds.x, bounds.y, 24, 24, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡', bounds.x + 12, bounds.y + 12);

      // Brand Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText((element as any).name, bounds.x + 32, bounds.y + 12);
      break;
    }

    case 'badge': {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, bounds.height / 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((element as any).text, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      break;
    }

    case 'price': {
      const priceEl = element as any;
      ctx.fillStyle = '#34d399'; // Emerald
      ctx.font = `800 ${computedFontSize || 20}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(priceEl.currentPrice, bounds.x, bounds.y);

      if (priceEl.discountText) {
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(priceEl.discountText, bounds.x, bounds.y + 22);
      }
      break;
    }

    case 'rating': {
      const ratingEl = element as any;
      ctx.fillStyle = '#fbbf24'; // Amber
      ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`★ ${ratingEl.score.toFixed(1)} (${ratingEl.reviewCount || ''})`, bounds.x, bounds.y + bounds.height / 2);
      break;
    }

    case 'cta': {
      const ctaEl = element as any;
      const ctaGrad = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
      ctaGrad.addColorStop(0, theme.primaryColor);
      ctaGrad.addColorStop(1, theme.accentColor);

      ctx.fillStyle = ctaGrad;
      drawRoundedRect(ctx, bounds.x, bounds.y, bounds.width, bounds.height, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${computedFontSize || 15}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${ctaEl.label} →`, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      break;
    }

    case 'legal': {
      const legalEl = element as any;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '400 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(legalEl.text, bounds.x, bounds.y + bounds.height / 2, bounds.width);
      break;
    }
  }

  // Debug Overlays
  if (options.showDebug) {
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(bounds.x, bounds.y - 14, 80, 14);
    ctx.fillStyle = '#a5b4fc';
    ctx.font = '500 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${role} [P:${element.priority}]`, bounds.x + 2, bounds.y - 12);
  }

  // Tap Target Overlay
  if (options.showTapTargets && node.tapTargetBounds) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(
      node.tapTargetBounds.x,
      node.tapTargetBounds.y,
      node.tapTargetBounds.width,
      node.tapTargetBounds.height
    );
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
