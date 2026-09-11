import React from 'react';
import { PRESET_SPECS } from '../engine/presets';
import { AdSpec, AdElement } from '../engine/types';
import { Code2 } from 'lucide-react';

interface SpecEditorProps {
  spec: AdSpec;
  onUpdateSpec: (updatedSpec: AdSpec) => void;
  onSelectPreset: (preset: AdSpec) => void;
}

export const SpecEditor: React.FC<SpecEditorProps> = ({
  spec,
  onUpdateSpec,
  onSelectPreset
}) => {
  const handleElementPriorityChange = (elementId: string, newPriority: number) => {
    const updatedElements = spec.elements.map((el: AdElement) => {
      if (el.id === elementId) {
        return { ...el, priority: newPriority };
      }
      return el;
    });
    onUpdateSpec({ ...spec, elements: updatedElements });
  };

  const handleElementTextChange = (elementId: string, field: string, value: string) => {
    const updatedElements = spec.elements.map((el: AdElement) => {
      if (el.id === elementId) {
        return { ...el, [field]: value };
      }
      return el;
    });
    onUpdateSpec({ ...spec, elements: updatedElements });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col gap-4">
      {/* Header & Preset Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Declarative Ad Spec Studio
            </h3>
            <p className="text-xs text-slate-400">
              Customize content and tweak priority weights to observe real-time layout adaptation.
            </p>
          </div>
        </div>

        {/* Preset Campaign Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Presets:</span>
          <select
            value={spec.id}
            onChange={(e) => {
              const selected = PRESET_SPECS.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            {PRESET_SPECS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Elements List with Live Content & Priority Sliders */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {spec.elements.map((el: AdElement) => {
          return (
            <div
              key={el.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 uppercase tracking-wide">
                    {el.role}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">({el.id})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Priority Weight:</span>
                  <span className="font-mono font-bold text-indigo-400 w-6 text-right">
                    {el.priority}
                  </span>
                </div>
              </div>

              {/* Priority Slider */}
              <input
                type="range"
                min="1"
                max="100"
                value={el.priority}
                onChange={(e) => handleElementPriorityChange(el.id, Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />

              {/* Role-Specific Quick Content Inputs */}
              {el.role === 'headline' && (
                <input
                  type="text"
                  value={(el as any).text}
                  onChange={(e) => handleElementTextChange(el.id, 'text', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Headline copy..."
                />
              )}

              {el.role === 'subhead' && (
                <input
                  type="text"
                  value={(el as any).text}
                  onChange={(e) => handleElementTextChange(el.id, 'text', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="Subhead copy..."
                />
              )}

              {el.role === 'cta' && (
                <input
                  type="text"
                  value={(el as any).label}
                  onChange={(e) => handleElementTextChange(el.id, 'label', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  placeholder="CTA button label..."
                />
              )}

              {el.role === 'price' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(el as any).currentPrice}
                    onChange={(e) => handleElementTextChange(el.id, 'currentPrice', e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="Price..."
                  />
                  <input
                    type="text"
                    value={(el as any).discountText || ''}
                    onChange={(e) => handleElementTextChange(el.id, 'discountText', e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="Discount badge..."
                  />
                </div>
              )}

              {el.role === 'branding' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={(el as any).name}
                    onChange={(e) => handleElementTextChange(el.id, 'name', e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="Brand name..."
                  />
                  <input
                    type="text"
                    value={(el as any).tagline || ''}
                    onChange={(e) => handleElementTextChange(el.id, 'tagline', e.target.value)}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    placeholder="Brand tagline..."
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
