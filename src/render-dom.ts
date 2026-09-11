/**
 * DOM Renderer Bridge & React Component Export
 * 
 * Provides both a React component (`DomRenderer`) and a vanilla DOM mounting
 * utility (`renderToDOM`) that consumes the ResolvedLayout AST.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { DomRenderer, DomRendererProps } from './renderers/dom/DomRenderer';
import { ResolvedLayout } from './engine/types';

export { DomRenderer } from './renderers/dom/DomRenderer';
export type { DomRendererProps } from './renderers/dom/DomRenderer';

/**
 * Vanilla DOM rendering helper to mount a resolved layout into any DOM element
 */
export function renderToDOM(
  layout: ResolvedLayout,
  container: HTMLElement,
  options?: Partial<Omit<DomRendererProps, 'layout'>>
): () => void {
  const root = createRoot(container);
  root.render(
    React.createElement(DomRenderer, {
      layout,
      showDebugOverlays: options?.showDebugOverlays,
      showTapTargets: options?.showTapTargets,
      showSafeAreas: options?.showSafeAreas,
      scale: options?.scale,
      onElementClick: options?.onElementClick
    })
  );

  return () => {
    root.unmount();
  };
}
