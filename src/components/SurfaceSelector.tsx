import React from 'react';
import { SurfaceProfile } from '../engine/types';
import { Smartphone, Monitor, Tv, Store, Sliders, Maximize2, Compass } from 'lucide-react';

interface SurfaceSelectorProps {
  surfaces: SurfaceProfile[];
  activeSurfaceId: string;
  onSelectSurface: (surface: SurfaceProfile) => void;
  isCustomResizing: boolean;
  setIsCustomResizing: (custom: boolean) => void;
  customWidth: number;
  customHeight: number;
  onCustomDimensionsChange: (width: number, height: number) => void;
}

export const SurfaceSelector: React.FC<SurfaceSelectorProps> = ({
  surfaces,
  activeSurfaceId,
  onSelectSurface,
  isCustomResizing,
  setIsCustomResizing,
  customWidth,
  customHeight,
  onCustomDimensionsChange
}) => {
  const getSurfaceIcon = (id: string) => {
    switch (id) {
      case 'mobile-portrait':
        return <Smartphone className="w-4 h-4" />;
      case 'mobile-landscape':
        return <Smartphone className="w-4 h-4 rotate-90" />;
      case 'broadcast-lower-third':
        return <Tv className="w-4 h-4" />;
      case 'square-kiosk':
        return <Store className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getAspectTag = (w: number, h: number) => {
    const ratio = w / h;
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16 Portrait';
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9 Landscape';
    if (Math.abs(ratio - 1.0) < 0.1) return '1:1 Square';
    if (ratio > 3.0) return '32:5 Ultra-Wide';
    return `${(Math.round(ratio * 10) / 10).toFixed(1)}:1 Ratio`;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Surface Environment & Constraints
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between radically different aspect ratios and physical viewing constraints.
          </p>
        </div>

        {/* Freeform Live Resizer Toggle */}
        <button
          onClick={() => setIsCustomResizing(!isCustomResizing)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isCustomResizing
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-300" />
          <span>Arbitrary Resizer Mode (5th Surface)</span>
        </button>
      </div>

      {/* Preset Surfaces Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {surfaces.map((s) => {
          const isActive = !isCustomResizing && activeSurfaceId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setIsCustomResizing(false);
                onSelectSurface(s);
              }}
              className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {getSurfaceIcon(s.id)}
                </div>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {getAspectTag(s.width, s.height)}
                </span>
              </div>

              <div className="font-bold text-xs text-slate-100 truncate">{s.name}</div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {s.width} × {s.height}px
              </div>

              <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/60 text-[9px] text-slate-400">
                <span className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-300">
                  {s.interactionMode === 'passive_broadcast' ? 'Passive View' : `Touch ≥${s.minTapTarget}px`}
                </span>
                <span className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-300">
                  Min Text: {s.minTextSize}px
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Freeform Live Resizer Sliders */}
      {isCustomResizing && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-indigo-500/40 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Live Arbitrary Resizer (Live Interview 5th Surface Test)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {customWidth} × {customHeight}px ({((customWidth / customHeight) || 1).toFixed(2)}:1 AR)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Surface Width</span>
                <span className="font-mono text-slate-200">{customWidth}px</span>
              </div>
              <input
                type="range"
                min="240"
                max="1400"
                step="10"
                value={customWidth}
                onChange={(e) => onCustomDimensionsChange(Number(e.target.value), customHeight)}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Surface Height</span>
                <span className="font-mono text-slate-200">{customHeight}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="10"
                value={customHeight}
                onChange={(e) => onCustomDimensionsChange(customWidth, Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
