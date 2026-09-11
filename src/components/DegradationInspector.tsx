import React from 'react';
import { ResolvedLayout } from '../engine/types';
import { Layers } from 'lucide-react';

interface DegradationInspectorProps {
  layout: ResolvedLayout;
  showDebugOverlays: boolean;
  setShowDebugOverlays: (show: boolean) => void;
  showTapTargets: boolean;
  setShowTapTargets: (show: boolean) => void;
  showSafeAreas: boolean;
  setShowSafeAreas: (show: boolean) => void;
}

export const DegradationInspector: React.FC<DegradationInspectorProps> = ({
  layout,
  showDebugOverlays,
  setShowDebugOverlays,
  showTapTargets,
  setShowTapTargets,
  showSafeAreas,
  setShowSafeAreas
}) => {
  const { diagnostics, nodes } = layout;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'retained_full':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">100% Fidelity</span>;
      case 'scaled_down':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">Scaled Down</span>;
      case 'compacted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">Compacted</span>;
      case 'dropped':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">Dropped</span>;
      default:
        return null;
    }
  };

  const utilization = Math.min(100, Math.round((diagnostics.consumedArea / diagnostics.usableArea) * 100));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-5">
      {/* Header & Visual Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Constraint & Degradation Diagnostics
            </h3>
            <p className="text-xs text-slate-400">
              Mathematical step-by-step spatial budgeting audit & element prioritization trace.
            </p>
          </div>
        </div>

        {/* Visual Overlay Toggles */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showDebugOverlays}
              onChange={(e) => setShowDebugOverlays(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            <span>Node Bounds</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showTapTargets}
              onChange={(e) => setShowTapTargets(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span>44px Touch Targets</span>
          </label>

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showSafeAreas}
              onChange={(e) => setShowSafeAreas(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Safe Inset Zones</span>
          </label>
        </div>
      </div>

      {/* Spatial Budget & Topology Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">Selected Topology</div>
          <div className="text-sm font-bold text-indigo-300 capitalize mt-0.5">
            {diagnostics.topology.replace('-', ' ')}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            AR: {diagnostics.aspectRatio}:1 ({diagnostics.aspectCategory})
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">Spatial Budget Utilized</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            {utilization}% Area Packed
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            {diagnostics.consumedArea.toLocaleString()} / {diagnostics.usableArea.toLocaleString()} px²
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">Element Retention</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {diagnostics.visibleElementCount} Kept • {diagnostics.droppedElementCount} Dropped
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Deterministic Priority Cascade
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-medium">Constraint Solver Time</div>
          <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
            {diagnostics.resolutionTimeMs} ms
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Zero Collisions Guaranteed
          </div>
        </div>
      </div>

      {/* Degradation Decision Log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Per-Element Degradation Decision Cascade
          </h4>
          <span className="text-[10px] text-slate-400">
            Ranked by priority score (100 = critical CTA, 1 = drop first)
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {diagnostics.degradationLog.map((log) => {
            const node = nodes.find((n) => n.id === log.elementId);
            const priority = node?.element.priority || 0;

            return (
              <div
                key={log.elementId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-[11px] text-indigo-300">
                    {priority}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px]">
                      {log.role}
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono ml-2">
                      ({log.elementId})
                    </span>
                    <div className="text-[11px] text-slate-400">{log.reason}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {getActionBadge(log.action)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
