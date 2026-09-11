/**
 * Adaptive Layout Constraint Resolver
 * 
 * Root export for the pure TypeScript constraint resolution engine.
 * Takes (adSpec, surfaceProfile) and returns the ResolvedLayout AST.
 */

import { constraintSolver } from './engine/solver';
import { AdSpec, SurfaceProfile, ResolvedLayout } from './engine/types';

export { ConstraintSolver, constraintSolver } from './engine/solver';
export { analyzeTopology } from './engine/topology';
export { computeDegradationPlan } from './engine/degradation';
export { textMeasurer } from './engine/text-measurer';
export * from './engine/types';

/**
 * Primary engine resolution entry point
 * 
 * @param spec Declarative ad specification
 * @param surface Physical surface profile with real constraints
 * @returns ResolvedLayout AST with pixel coordinates, scales, and degradation audit
 */
export function resolveLayout(spec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  return constraintSolver.resolve(spec, surface);
}
