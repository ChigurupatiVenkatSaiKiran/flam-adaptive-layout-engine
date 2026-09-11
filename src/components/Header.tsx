import React from 'react';
import { Sparkles, Layers, Cpu, CheckCircle2, ShieldAlert, Code2 } from 'lucide-react';

interface HeaderProps {
  resolutionTimeMs: number;
  hasCollisions: boolean;
  wcagTouchCompliant: boolean;
  rendererMode: 'dom' | 'canvas' | 'split';
  setRendererMode: (mode: 'dom' | 'canvas' | 'split') => void;
  showInspector: boolean;
  setShowInspector: (show: boolean) => void;
  showSpecEditor: boolean;
  setShowSpecEditor: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  resolutionTimeMs,
  hasCollisions,
  wcagTouchCompliant,
  rendererMode,
  setRendererMode,
  showInspector,
  setShowInspector,
  showSpecEditor,
  setShowSpecEditor
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Engine Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
                Flam Adaptive Layout Engine
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                R&D v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Constraint-Driven Multi-Surface Ad Resolution • Zero Hardcoded Breakpoints
            </p>
          </div>
        </div>

        {/* Live Engine Diagnostic Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Resolution Speed Metric */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Solver:</span>
            <span className="font-mono font-semibold text-emerald-400">{resolutionTimeMs}ms</span>
          </div>

          {/* Zero Overlap Verification Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
            hasCollisions
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
          }`}>
            {hasCollisions ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="font-medium">
              {hasCollisions ? 'Collision Detected' : '0 Overlaps'}
            </span>
          </div>

          {/* WCAG Touch Compliance */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${
            wcagTouchCompliant
              ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300'
              : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">WCAG 2.5.5 Touch (44px)</span>
          </div>
        </div>

        {/* Action Controls & Renderer Toggle */}
        <div className="flex items-center gap-2">
          {/* Renderer Selector */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setRendererMode('dom')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                rendererMode === 'dom'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DOM
            </button>
            <button
              onClick={() => setRendererMode('canvas')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                rendererMode === 'canvas'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Canvas 2D
            </button>
            <button
              onClick={() => setRendererMode('split')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                rendererMode === 'split'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          {/* Spec Editor Toggle */}
          <button
            onClick={() => setShowSpecEditor(!showSpecEditor)}
            className={`p-2 rounded-lg border transition-all ${
              showSpecEditor
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Edit Declarative Ad Spec"
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Degradation Inspector Toggle */}
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-lg border transition-all ${
              showInspector
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Degradation & Layout Inspector"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
