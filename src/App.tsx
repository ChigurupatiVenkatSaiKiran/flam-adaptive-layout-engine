import { useState, useMemo } from 'react';
import { resolveLayout } from './resolver';
import { PRESET_SPECS, PRESET_SURFACES } from './engine/presets';
import { AdSpec, SurfaceProfile } from './engine/types';
import { DomRenderer } from './renderers/dom/DomRenderer';
import { CanvasRenderer } from './renderers/canvas/CanvasRenderer';
import { Header } from './components/Header';
import { SurfaceSelector } from './components/SurfaceSelector';
import { DegradationInspector } from './components/DegradationInspector';
import { SpecEditor } from './components/SpecEditor';

export function App() {
  // Active State
  const [currentSpec, setCurrentSpec] = useState<AdSpec>(PRESET_SPECS[0]);
  const [activeSurface, setActiveSurface] = useState<SurfaceProfile>(PRESET_SURFACES[0]);

  // Arbitrary Freeform Resizer State (For Live Interview 5th Surface Test)
  const [isCustomResizing, setIsCustomResizing] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number>(420);
  const [customHeight, setCustomHeight] = useState<number>(720);

  // Overlay & Debug State
  const [showDebugOverlays, setShowDebugOverlays] = useState<boolean>(false);
  const [showTapTargets, setShowTapTargets] = useState<boolean>(false);
  const [showSafeAreas, setShowSafeAreas] = useState<boolean>(true);
  const [rendererMode, setRendererMode] = useState<'dom' | 'canvas' | 'split'>('dom');
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const [showSpecEditor, setShowSpecEditor] = useState<boolean>(false);

  // Compute Active Surface Profile
  const effectiveSurface: SurfaceProfile = useMemo(() => {
    if (!isCustomResizing) return activeSurface;
    return {
      id: 'custom-surface',
      name: `Custom (${customWidth}×${customHeight})`,
      description: 'Arbitrary dynamic surface configured live',
      width: customWidth,
      height: customHeight,
      dpr: 2,
      viewingDistance: customHeight < 250 && customWidth > 800 ? 'far' : 'near',
      interactionMode: 'touch',
      safeInsets: {
        top: Math.round(customHeight * 0.05),
        right: Math.round(customWidth * 0.04),
        bottom: Math.round(customHeight * 0.05),
        left: Math.round(customWidth * 0.04)
      },
      minTapTarget: 44,
      minTextSize: customHeight < 250 && customWidth > 800 ? 18 : 12,
      targetFps: 60
    };
  }, [isCustomResizing, activeSurface, customWidth, customHeight]);

  // Execute Layout Engine Solver
  const resolvedLayout = useMemo(() => {
    try {
      return resolveLayout(currentSpec, effectiveSurface);
    } catch (err) {
      console.error('Layout Resolution Error:', err);
      // Fallback
      return resolveLayout(PRESET_SPECS[0], PRESET_SURFACES[0]);
    }
  }, [currentSpec, effectiveSurface]);

  // Calculate viewport fit scale so huge canvases (like 1200px broadcast) don't overflow the UI
  const displayScale = useMemo(() => {
    const maxWidth = rendererMode === 'split' ? 520 : 960;
    const maxHeight = 620;
    const scaleW = maxWidth / effectiveSurface.width;
    const scaleH = maxHeight / effectiveSurface.height;
    return Math.min(1, Math.min(scaleW, scaleH));
  }, [effectiveSurface.width, effectiveSurface.height, rendererMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-16">
      {/* Header */}
      <Header
        resolutionTimeMs={resolvedLayout.diagnostics.resolutionTimeMs}
        hasCollisions={resolvedLayout.diagnostics.hasCollisions}
        wcagTouchCompliant={resolvedLayout.diagnostics.wcagTouchCompliant}
        rendererMode={rendererMode}
        setRendererMode={setRendererMode}
        showInspector={showInspector}
        setShowInspector={setShowInspector}
        showSpecEditor={showSpecEditor}
        setShowSpecEditor={setShowSpecEditor}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6 flex flex-col gap-6 w-full">
        {/* Surface Controls & Resizer */}
        <SurfaceSelector
          surfaces={PRESET_SURFACES}
          activeSurfaceId={activeSurface.id}
          onSelectSurface={setActiveSurface}
          isCustomResizing={isCustomResizing}
          setIsCustomResizing={setIsCustomResizing}
          customWidth={customWidth}
          customHeight={customHeight}
          onCustomDimensionsChange={(w, h) => {
            setCustomWidth(w);
            setCustomHeight(h);
          }}
        />

        {/* Live Ad Spec Editor (Toggleable) */}
        {showSpecEditor && (
          <SpecEditor
            spec={currentSpec}
            onUpdateSpec={setCurrentSpec}
            onSelectPreset={setCurrentSpec}
          />
        )}

        {/* Main Resolution Canvas & Render Stage */}
        <section className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden bg-safe-zone-pattern">
          {/* Stage Header Info */}
          <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-slate-200">
                Live Resolution Stage: {effectiveSurface.name}
              </span>
              <span className="font-mono text-slate-400">
                ({effectiveSurface.width}×{effectiveSurface.height}px @ DPR {effectiveSurface.dpr})
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="hidden sm:inline">
                Scale: <span className="font-mono text-slate-200">{Math.round(displayScale * 100)}%</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-indigo-300">
                {resolvedLayout.diagnostics.topology}
              </span>
            </div>
          </div>

          {/* Render Containers based on Mode */}
          <div className="w-full flex items-center justify-center gap-8 py-4 overflow-auto">
            {rendererMode === 'dom' && (
              <DomRenderer
                layout={resolvedLayout}
                showDebugOverlays={showDebugOverlays}
                showTapTargets={showTapTargets}
                showSafeAreas={showSafeAreas}
                scale={displayScale}
              />
            )}

            {rendererMode === 'canvas' && (
              <CanvasRenderer
                layout={resolvedLayout}
                showDebugOverlays={showDebugOverlays}
                showTapTargets={showTapTargets}
                showSafeAreas={showSafeAreas}
                scale={displayScale}
              />
            )}

            {rendererMode === 'split' && (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    DOM / React Backend
                  </span>
                  <DomRenderer
                    layout={resolvedLayout}
                    showDebugOverlays={showDebugOverlays}
                    showTapTargets={showTapTargets}
                    showSafeAreas={showSafeAreas}
                    scale={displayScale * 0.9}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    HTML5 Canvas 2D Backend
                  </span>
                  <CanvasRenderer
                    layout={resolvedLayout}
                    showDebugOverlays={showDebugOverlays}
                    showTapTargets={showTapTargets}
                    showSafeAreas={showSafeAreas}
                    scale={displayScale * 0.9}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Degradation & Layout Diagnostics Drawer */}
        {showInspector && (
          <DegradationInspector
            layout={resolvedLayout}
            showDebugOverlays={showDebugOverlays}
            setShowDebugOverlays={setShowDebugOverlays}
            showTapTargets={showTapTargets}
            setShowTapTargets={setShowTapTargets}
            showSafeAreas={showSafeAreas}
            setShowSafeAreas={setShowSafeAreas}
          />
        )}
      </main>
    </div>
  );
}
