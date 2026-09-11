import React, { useEffect, useRef } from 'react';
import { ResolvedLayout } from '../../engine/types';
import { renderLayoutToCanvas } from './canvas-draw';

export interface CanvasRendererProps {
  layout: ResolvedLayout;
  showDebugOverlays?: boolean;
  showTapTargets?: boolean;
  showSafeAreas?: boolean;
  scale?: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  layout,
  showDebugOverlays = false,
  showTapTargets = false,
  showSafeAreas = false,
  scale = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI canvas buffer resolution
    canvas.width = layout.surfaceWidth * dpr;
    canvas.height = layout.surfaceHeight * dpr;

    renderLayoutToCanvas(ctx, layout, {
      showDebug: showDebugOverlays,
      showSafeAreas,
      showTapTargets,
      dpr
    });
  }, [layout, showDebugOverlays, showTapTargets, showSafeAreas, dpr]);

  return (
    <div
      className="inline-block shadow-2xl transition-all duration-300"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${layout.surfaceWidth}px`,
          height: `${layout.surfaceHeight}px`,
          borderRadius: `${layout.theme.cornerRadius || 16}px`
        }}
        className="block"
      />
    </div>
  );
};
