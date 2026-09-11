import React from 'react';
import { ResolvedLayout, ResolvedNode, AdElement } from '../../engine/types';
import confetti from 'canvas-confetti';
import { Sparkles, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';

export interface DomRendererProps {
  layout: ResolvedLayout;
  showDebugOverlays?: boolean;
  showTapTargets?: boolean;
  showSafeAreas?: boolean;
  scale?: number;
  onElementClick?: (node: ResolvedNode) => void;
}

export const DomRenderer: React.FC<DomRendererProps> = ({
  layout,
  showDebugOverlays = false,
  showTapTargets = false,
  showSafeAreas = false,
  scale = 1,
  onElementClick
}) => {
  const { surfaceWidth, surfaceHeight, safeBounds, nodes, theme } = layout;

  const handleCtaClick = (e: React.MouseEvent, node: ResolvedNode) => {
    e.stopPropagation();
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y }
      });
    } catch {
      // Confetti fallback
    }
    onElementClick?.(node);
  };

  return (
    <div
      className="relative overflow-hidden transition-all duration-500 ease-out select-none shadow-2xl"
      style={{
        width: `${surfaceWidth}px`,
        height: `${surfaceHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        background: theme.backgroundGradient || theme.backgroundColor,
        borderRadius: `${theme.cornerRadius || 16}px`,
        color: theme.textColor,
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}
    >
      {/* Background Ambient Glow FX */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: theme.primaryColor }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: theme.accentColor }}
      />

      {/* Optional Safe Area Overlay */}
      {showSafeAreas && (
        <div
          className="absolute border border-dashed border-amber-400/60 pointer-events-none z-50 flex items-start justify-start p-1"
          style={{
            left: `${safeBounds.x}px`,
            top: `${safeBounds.y}px`,
            width: `${safeBounds.width}px`,
            height: `${safeBounds.height}px`
          }}
        >
          <span className="text-[9px] uppercase tracking-wider font-mono text-amber-300/80 bg-amber-950/80 px-1 py-0.5 rounded">
            Safe Action Inset ({safeBounds.width}x{safeBounds.height})
          </span>
        </div>
      )}

      {/* Render Active Nodes */}
      {nodes
        .filter((node) => node.visible)
        .map((node) => {
          return (
            <NodeComponent
              key={node.id}
              node={node}
              theme={theme}
              showDebug={showDebugOverlays}
              showTapTarget={showTapTargets}
              onCtaClick={handleCtaClick}
              onNodeClick={() => onElementClick?.(node)}
            />
          );
        })}
    </div>
  );
};

interface NodeComponentProps {
  node: ResolvedNode;
  theme: ResolvedLayout['theme'];
  showDebug: boolean;
  showTapTarget: boolean;
  onCtaClick: (e: React.MouseEvent, node: ResolvedNode) => void;
  onNodeClick: () => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  theme,
  showDebug,
  showTapTarget,
  onCtaClick,
  onNodeClick
}) => {
  const { bounds, role, element, computedFontSize, computedLineHeight, computedLines, zIndex } = node;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.x}px`,
    top: `${bounds.y}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    zIndex,
    transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const renderContent = () => {
    switch (role) {
      case 'media': {
        const mediaEl = element as Extract<AdElement, { role: 'media' }>;
        return (
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg group">
            <img
              src={mediaEl.src}
              alt={mediaEl.alt}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {mediaEl.accentGlow && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
                style={{
                  background: `radial-gradient(circle at center, ${mediaEl.accentGlow} 0%, transparent 70%)`
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        );
      }

      case 'headline': {
        const headlineEl = element as Extract<AdElement, { role: 'headline' }>;
        const text = computedLines && computedLines.length > 0 ? computedLines.join(' ') : headlineEl.text;
        return (
          <h2
            className="font-extrabold tracking-tight text-white flex items-center"
            style={{
              fontSize: `${computedFontSize || 22}px`,
              lineHeight: `${computedLineHeight || 28}px`,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}
          >
            {text}
          </h2>
        );
      }

      case 'subhead': {
        const subheadEl = element as Extract<AdElement, { role: 'subhead' }>;
        const text = computedLines && computedLines.length > 0 ? computedLines.join(' ') : subheadEl.text;
        return (
          <p
            className="text-slate-300 font-normal leading-snug"
            style={{
              fontSize: `${computedFontSize || 14}px`,
              lineHeight: `${computedLineHeight || 18}px`
            }}
          >
            {text}
          </p>
        );
      }

      case 'branding': {
        const brandEl = element as Extract<AdElement, { role: 'branding' }>;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow"
              style={{ background: theme.primaryColor, color: '#fff' }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div
                className="font-bold tracking-wider uppercase leading-none"
                style={{ fontSize: `${computedFontSize || 13}px`, color: theme.textColor }}
              >
                {brandEl.name}
              </div>
              {brandEl.tagline && bounds.height > 26 && (
                <div className="text-[10px] text-slate-400 font-medium leading-tight">
                  {brandEl.tagline}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'badge': {
        const badgeEl = element as Extract<AdElement, { role: 'badge' }>;
        return (
          <div
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff'
            }}
          >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>{badgeEl.text}</span>
          </div>
        );
      }

      case 'price': {
        const priceEl = element as Extract<AdElement, { role: 'price' }>;
        return (
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-1.5">
              <span
                className="font-extrabold text-emerald-400 tracking-tight"
                style={{ fontSize: `${computedFontSize || 20}px` }}
              >
                {priceEl.currentPrice}
              </span>
              {priceEl.originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  {priceEl.originalPrice}
                </span>
              )}
            </div>
            {priceEl.discountText && bounds.height > 30 && (
              <span className="text-[10px] font-semibold text-emerald-300/90 uppercase tracking-wider">
                {priceEl.discountText}
              </span>
            )}
          </div>
        );
      }

      case 'rating': {
        const ratingEl = element as Extract<AdElement, { role: 'rating' }>;
        return (
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span
              className="font-bold text-white text-xs"
              style={{ fontSize: `${computedFontSize || 12}px` }}
            >
              {ratingEl.score.toFixed(1)}
            </span>
            {ratingEl.reviewCount && bounds.width > 90 && (
              <span className="text-[11px] text-slate-400">
                ({ratingEl.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        );
      }

      case 'cta': {
        const ctaEl = element as Extract<AdElement, { role: 'cta' }>;
        return (
          <button
            type="button"
            onClick={(e) => onCtaClick(e, node)}
            className="w-full h-full rounded-xl font-bold tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group overflow-hidden relative"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%)`,
              color: '#ffffff',
              fontSize: `${computedFontSize || 15}px`,
              boxShadow: `0 8px 24px -4px ${theme.primaryColor}66`
            }}
          >
            <span className="relative z-10">{ctaEl.label}</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </button>
        );
      }

      case 'legal': {
        const legalEl = element as Extract<AdElement, { role: 'legal' }>;
        return (
          <div
            className="text-slate-400/80 font-normal leading-tight flex items-center gap-1"
            style={{ fontSize: `${computedFontSize || 9}px` }}
          >
            <ShieldCheck className="w-2.5 h-2.5 inline shrink-0" />
            <span className="truncate">{legalEl.text}</span>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onClick={onNodeClick}
      className={`group/node ${showDebug ? 'outline outline-1 outline-indigo-400/50 hover:outline-indigo-400' : ''}`}
    >
      {renderContent()}

      {/* Debug Bounds & Priority Inspector Badge */}
      {showDebug && (
        <div className="absolute -top-3 left-0 bg-slate-900/90 text-indigo-300 text-[9px] font-mono px-1 py-0.2 rounded border border-indigo-500/40 pointer-events-none z-50 shadow whitespace-nowrap">
          {role} (P:{element.priority}) {Math.round(bounds.width)}x{Math.round(bounds.height)}
        </div>
      )}

      {/* Tap Target Accessibility Highlight Overlay */}
      {showTapTarget && node.tapTargetBounds && (
        <div
          className="absolute border border-emerald-400/60 bg-emerald-500/10 pointer-events-none z-40 rounded"
          style={{
            left: `${node.tapTargetBounds.x - bounds.x}px`,
            top: `${node.tapTargetBounds.y - bounds.y}px`,
            width: `${node.tapTargetBounds.width}px`,
            height: `${node.tapTargetBounds.height}px`
          }}
        >
          <span className="absolute bottom-0 right-0 text-[8px] bg-emerald-950 text-emerald-300 px-0.5 font-mono">
            {node.tapTargetBounds.width}x{node.tapTargetBounds.height}px tap
          </span>
        </div>
      )}
    </div>
  );
};
