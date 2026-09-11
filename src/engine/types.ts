/**
 * Flam Adaptive Layout Engine - Core Type Definitions
 * 
 * Defines the contract for:
 * 1. Declarative Ad Specifications (content & layout intent independent of surface)
 * 2. Surface Profiles & Physical Constraints
 * 3. Resolved Layout AST (exact pixel geometry, scales, styling, and metadata)
 * 4. Engine Resolution Traces & Degradation Diagnostics
 */

// ==========================================
// 1. AD SPECIFICATION DEFINITIONS
// ==========================================

export type ElementRole =
  | 'branding'     // Logo, brand mark, advertiser name
  | 'headline'     // Primary compelling title
  | 'subhead'      // Supporting contextual copy
  | 'media'        // Hero product visual (image/video/3D model projection)
  | 'price'        // Price tag / discount badge
  | 'rating'       // Social proof / star rating
  | 'cta'          // Call to action button / interactive trigger
  | 'legal'        // Regulatory text / disclaimer / copyright
  | 'badge';       // Floating tag (e.g. "NEW", "SPONSORED", "LIMITED")

export interface BaseElementSpec {
  id: string;
  role: ElementRole;
  priority: number;            // 1 to 100 (100 = critical/never drop, 1 = drop first)
  minWidth?: number;          // Absolute minimum pixel width before degrading/dropping
  minHeight?: number;         // Absolute minimum pixel height before degrading/dropping
  preferredAspect?: number;   // Preferred width/height ratio (e.g., 1.0 for square, 1.77 for 16:9)
  shrinkResistance?: number;  // 0.0 (shrinks eagerly) to 1.0 (resists shrinking)
  dropThreshold?: number;     // Spatial budget percentage below which element must be dropped
}

export interface HeadlineElement extends BaseElementSpec {
  role: 'headline';
  text: string;
  maxLines?: number;
  baseFontSize?: number;      // Target font size in px at standard 1080p canvas
  weight?: 'bold' | 'extra-bold' | 'black';
}

export interface SubheadElement extends BaseElementSpec {
  role: 'subhead';
  text: string;
  maxLines?: number;
  baseFontSize?: number;
}

export interface MediaElement extends BaseElementSpec {
  role: 'media';
  src: string;
  alt: string;
  fitMode?: 'cover' | 'contain' | 'smart-crop';
  accentGlow?: string;
}

export interface CtaElement extends BaseElementSpec {
  role: 'cta';
  label: string;
  variant?: 'primary' | 'glow' | 'pill' | 'minimal';
  minTapWidth?: number;       // default 44px for touch surfaces
  minTapHeight?: number;      // default 44px for touch surfaces
}

export interface PriceElement extends BaseElementSpec {
  role: 'price';
  currentPrice: string;
  originalPrice?: string;
  discountText?: string;
}

export interface RatingElement extends BaseElementSpec {
  role: 'rating';
  score: number;              // e.g. 4.9
  reviewCount?: number;       // e.g. 1280
}

export interface BrandingElement extends BaseElementSpec {
  role: 'branding';
  logoSrc?: string;
  name: string;
  tagline?: string;
}

export interface LegalElement extends BaseElementSpec {
  role: 'legal';
  text: string;
  microcopy?: boolean;
}

export interface BadgeElement extends BaseElementSpec {
  role: 'badge';
  text: string;
  colorTheme?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export type AdElement =
  | HeadlineElement
  | SubheadElement
  | MediaElement
  | CtaElement
  | PriceElement
  | RatingElement
  | BrandingElement
  | LegalElement
  | BadgeElement;

export interface AdTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  mutedTextColor: string;
  glassmorphism?: boolean;
  cornerRadius?: number;
}

export interface AdSpec {
  id: string;
  name: string;
  elements: AdElement[];
  theme: AdTheme;
  metadata?: {
    campaignName?: string;
    vertical?: 'ecommerce' | 'gaming' | 'luxury' | 'f&b' | 'spatial';
  };
}

// ==========================================
// 2. SURFACE PROFILES & HARD CONSTRAINTS
// ==========================================

export type ViewingDistance = 'near' | 'medium' | 'far'; // near (mobile 30cm), medium (kiosk 1m), far (broadcast 3m)
export type InteractionMode = 'touch' | 'pointer' | 'passive_broadcast' | 'kiosk_touch';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SurfaceProfile {
  id: string;
  name: string;
  description: string;
  width: number;              // Surface pixel width
  height: number;             // Surface pixel height
  dpr: number;                // Device pixel ratio
  viewingDistance: ViewingDistance;
  interactionMode: InteractionMode;
  safeInsets: Insets;         // Safe action boundary (e.g. broadcast action safe or mobile notch)
  minTapTarget: number;       // Minimum touch bounding box in px (WCAG 2.5.5 requirement: 44px)
  minTextSize: number;        // Minimum legible text size in px for given viewing distance
  maxElements?: number;       // Optional hard cap on simultaneous visible elements
  targetFps?: number;
}

// ==========================================
// 3. RESOLVED LAYOUT AST OUTPUT
// ==========================================

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedNode {
  id: string;
  role: ElementRole;
  element: AdElement;
  bounds: LayoutBounds;
  visible: boolean;
  opacity: number;
  scale: number;
  zIndex: number;
  
  // Computed typography & content rendering attributes
  computedFontSize?: number;
  computedLineHeight?: number;
  computedLines?: string[];
  isTruncated?: boolean;
  
  // Accessibility & interaction metadata
  tapTargetBounds?: LayoutBounds; // Guaranteed >= minTapTarget if interactive
  isTapTargetCompliant?: boolean;
  
  // Layout engine audit trace
  placementReason: string;
  degradationStage: 'original' | 'shrunk' | 'compact' | 'dropped';
}

export type LayoutTopology =
  | 'split-horizontal'    // Left Media | Right Details (landscape/wide)
  | 'split-vertical'      // Top Media | Bottom Details (portrait/mobile)
  | 'banner-inline'       // Left-to-right inline strip (broadcast lower-third)
  | 'hero-overlay'        // Fullscreen media background with floating card content
  | 'quadrant-grid'       // Balanced 2x2 grid layout (square kiosk)
  | 'compact-strip';      // Extreme micro layout

export interface LayoutDiagnostics {
  totalBudgetArea: number;
  usableArea: number;
  consumedArea: number;
  aspectRatio: number;
  aspectCategory: 'ultra-wide' | 'wide' | 'square' | 'tall' | 'ultra-tall';
  topology: LayoutTopology;
  visibleElementCount: number;
  droppedElementCount: number;
  droppedElementIds: string[];
  degradationLog: {
    elementId: string;
    role: ElementRole;
    action: 'retained_full' | 'scaled_down' | 'compacted' | 'dropped';
    reason: string;
  }[];
  resolutionTimeMs: number;
  hasCollisions: boolean;
  wcagTouchCompliant: boolean;
}

export interface ResolvedLayout {
  specId: string;
  surfaceId: string;
  surfaceWidth: number;
  surfaceHeight: number;
  safeBounds: LayoutBounds;
  nodes: ResolvedNode[];
  diagnostics: LayoutDiagnostics;
  theme: AdTheme;
}
