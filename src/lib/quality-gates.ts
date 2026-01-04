/**
 * Quality Gates Library - Enforce statistical evidence requirements.
 *
 * This module implements the "Finding Gating Rule" and ML pipeline validation
 * to ensure research outputs meet senior data scientist quality standards.
 *
 * Quality Gate Rules:
 * - Every [FINDING] must have [STAT:ci] within 10 lines BEFORE it
 * - Every [FINDING] must have [STAT:effect_size] within 10 lines BEFORE it
 * - ML pipelines must have baseline, cross-validation, and interpretation markers
 *
 * Penalties:
 * - FINDING_NO_CI: -30
 * - FINDING_NO_EFFECT_SIZE: -30
 * - ML_NO_BASELINE: -20
 * - ML_NO_CV: -25
 * - ML_NO_INTERPRETATION: -15
 *
 * @module quality-gates
 */

import { parseMarkers, getMarkersByType, ParsedMarker } from "./marker-parser";

/**
 * Types of quality gate violations.
 */
export type ViolationType =
  | "FINDING_NO_CI"
  | "FINDING_NO_EFFECT_SIZE"
  | "ML_NO_BASELINE"
  | "ML_NO_CV"
  | "ML_NO_INTERPRETATION";

/**
 * A single quality gate violation.
 */
export interface QualityViolation {
  /** Type of violation */
  type: ViolationType;
  /** Human-readable message */
  message: string;
  /** Line number where violation occurred */
  lineNumber: number;
  /** The content that caused the violation */
  content: string;
  /** Trust score penalty for this violation */
  penalty: number;
}

/**
 * Summary of findings validation.
 */
export interface FindingValidation {
  /** Total number of findings found */
  total: number;
  /** Number of verified findings (with proper evidence) */
  verified: number;
  /** Number of unverified findings (missing evidence) */
  unverified: number;
}

/**
 * Summary of ML pipeline validation.
 */
export interface MLPipelineValidation {
  /** Whether baseline metrics are present */
  hasBaseline: boolean;
  /** Whether cross-validation metrics are present */
  hasCV: boolean;
  /** Whether interpretation markers are present */
  hasInterpretation: boolean;
}

/**
 * Result of running quality gates on text.
 */
export interface QualityGateResult {
  /** Whether all quality gates passed */
  passed: boolean;
  /** List of violations found */
  violations: QualityViolation[];
  /** Quality score (100 - sum of penalties, min 0) */
  score: number;
  /** Summary of findings validation */
  findingsValidation: FindingValidation;
  /** Summary of ML pipeline validation */
  mlValidation: MLPipelineValidation;
}

/**
 * Penalty values for each violation type.
 */
const PENALTIES: Record<ViolationType, number> = {
  FINDING_NO_CI: 30,
  FINDING_NO_EFFECT_SIZE: 30,
  ML_NO_BASELINE: 20,
  ML_NO_CV: 25,
  ML_NO_INTERPRETATION: 15,
};

/**
 * Number of lines to look back for statistical evidence before a finding.
 */
const LOOKBACK_LINES = 10;

/**
 * Check if a STAT marker with specific subtype exists within N lines before a given line.
 *
 * @param markers - All parsed markers
 * @param targetLine - Line number of the finding
 * @param statSubtype - The STAT subtype to look for (e.g., 'ci', 'effect_size')
 * @param lookback - Number of lines to look back (default: 10)
 * @returns true if the required STAT marker exists within the lookback window
 */
function hasStatMarkerBefore(
  markers: ParsedMarker[],
  targetLine: number,
  statSubtype: string,
  lookback: number = LOOKBACK_LINES
): boolean {
  const minLine = Math.max(1, targetLine - lookback);

  return markers.some(
    (m) =>
      m.type === "STAT" &&
      m.subtype === statSubtype &&
      m.lineNumber >= minLine &&
      m.lineNumber < targetLine
  );
}

/**
 * Validate findings for required statistical evidence.
 *
 * The "Finding Gating Rule" requires:
 * - Every [FINDING] must have [STAT:ci] within 10 lines BEFORE it
 * - Every [FINDING] must have [STAT:effect_size] within 10 lines BEFORE it
 *
 * @param text - Multi-line text containing research output
 * @returns Object with violations array and validation summary
 *
 * @example
 * ```typescript
 * const text = `
 * [STAT:ci] 95% CI [0.82, 0.94]
 * [STAT:effect_size] Cohen's d = 0.75 (medium)
 * [FINDING] Treatment shows significant effect
 * `;
 * const result = validateFindings(text);
 * // result.violations.length === 0 (properly evidenced finding)
 * ```
 */
export function validateFindings(text: string): {
  violations: QualityViolation[];
  validation: FindingValidation;
} {
  const parseResult = parseMarkers(text);
  const markers = parseResult.markers;
  const findings = getMarkersByType(markers, "FINDING");

  const violations: QualityViolation[] = [];
  let verified = 0;
  let unverified = 0;

  for (const finding of findings) {
    const hasCI = hasStatMarkerBefore(markers, finding.lineNumber, "ci");
    const hasEffectSize = hasStatMarkerBefore(
      markers,
      finding.lineNumber,
      "effect_size"
    );

    let findingVerified = true;

    if (!hasCI) {
      violations.push({
        type: "FINDING_NO_CI",
        message: `Finding at line ${finding.lineNumber} missing [STAT:ci] within preceding ${LOOKBACK_LINES} lines`,
        lineNumber: finding.lineNumber,
        content: finding.content,
        penalty: PENALTIES.FINDING_NO_CI,
      });
      findingVerified = false;
    }

    if (!hasEffectSize) {
      violations.push({
        type: "FINDING_NO_EFFECT_SIZE",
        message: `Finding at line ${finding.lineNumber} missing [STAT:effect_size] within preceding ${LOOKBACK_LINES} lines`,
        lineNumber: finding.lineNumber,
        content: finding.content,
        penalty: PENALTIES.FINDING_NO_EFFECT_SIZE,
      });
      findingVerified = false;
    }

    if (findingVerified) {
      verified++;
    } else {
      unverified++;
    }
  }

  return {
    violations,
    validation: {
      total: findings.length,
      verified,
      unverified,
    },
  };
}

/**
 * Interpretation marker subtypes that satisfy the interpretation requirement.
 */
const INTERPRETATION_SUBTYPES = [
  "feature_importance",
  "top_features",
  "shap",
  "permutation_importance",
  "interpretation",
];

/**
 * Validate ML pipeline for required components.
 *
 * ML pipeline requirements:
 * - Baseline: [METRIC:baseline_*] marker present
 * - Cross-validation: [METRIC:cv_*] marker present
 * - Interpretation: Feature importance, SHAP, or similar markers present
 *
 * @param markers - Array of parsed markers
 * @returns Object with violations array and validation summary
 *
 * @example
 * ```typescript
 * const result = parseMarkers(text);
 * const mlResult = validateMLPipeline(result.markers);
 * if (!mlResult.validation.hasBaseline) {
 *   console.log("Missing baseline comparison!");
 * }
 * ```
 */
export function validateMLPipeline(markers: ParsedMarker[]): {
  violations: QualityViolation[];
  validation: MLPipelineValidation;
} {
  const violations: QualityViolation[] = [];

  const hasBaseline = markers.some(
    (m) => m.type === "METRIC" && m.subtype?.startsWith("baseline")
  );

  const hasCV = markers.some(
    (m) => m.type === "METRIC" && m.subtype?.startsWith("cv")
  );

  const hasInterpretation = markers.some(
    (m) =>
      m.type === "METRIC" &&
      m.subtype &&
      INTERPRETATION_SUBTYPES.some(
        (interp) =>
          m.subtype!.includes(interp) || m.subtype!.toLowerCase().includes(interp)
      )
  );

  const hasMLMetrics = markers.some(
    (m) =>
      m.type === "METRIC" &&
      (m.subtype?.includes("accuracy") ||
        m.subtype?.includes("precision") ||
        m.subtype?.includes("recall") ||
        m.subtype?.includes("f1") ||
        m.subtype?.includes("auc") ||
        m.subtype?.includes("rmse") ||
        m.subtype?.includes("mae") ||
        m.subtype?.includes("r2") ||
        m.subtype?.includes("mse"))
  );

  if (hasMLMetrics) {
    if (!hasBaseline) {
      violations.push({
        type: "ML_NO_BASELINE",
        message: "ML pipeline missing baseline comparison ([METRIC:baseline_*])",
        lineNumber: 0,
        content: "",
        penalty: PENALTIES.ML_NO_BASELINE,
      });
    }

    if (!hasCV) {
      violations.push({
        type: "ML_NO_CV",
        message:
          "ML pipeline missing cross-validation metrics ([METRIC:cv_*])",
        lineNumber: 0,
        content: "",
        penalty: PENALTIES.ML_NO_CV,
      });
    }

    if (!hasInterpretation) {
      violations.push({
        type: "ML_NO_INTERPRETATION",
        message:
          "ML pipeline missing interpretation ([METRIC:feature_importance], SHAP, etc.)",
        lineNumber: 0,
        content: "",
        penalty: PENALTIES.ML_NO_INTERPRETATION,
      });
    }
  }

  return {
    violations,
    validation: {
      hasBaseline,
      hasCV,
      hasInterpretation,
    },
  };
}

/**
 * Run all quality gates on research output text.
 *
 * Validates:
 * 1. Finding Gating Rule - Every [FINDING] needs [STAT:ci] + [STAT:effect_size]
 * 2. ML Pipeline Requirements - baseline, CV, interpretation markers
 *
 * @param text - Multi-line text containing research output
 * @returns QualityGateResult with pass/fail status, violations, and score
 *
 * @example
 * ```typescript
 * const result = runQualityGates(notebookOutput);
 * if (!result.passed) {
 *   console.log(`Quality score: ${result.score}/100`);
 *   for (const v of result.violations) {
 *     console.log(`- ${v.message} (penalty: -${v.penalty})`);
 *   }
 * }
 * ```
 */
export function runQualityGates(text: string): QualityGateResult {
  const parseResult = parseMarkers(text);
  const markers = parseResult.markers;

  const findingsResult = validateFindings(text);
  const mlResult = validateMLPipeline(markers);

  const allViolations = [...findingsResult.violations, ...mlResult.violations];

  const totalPenalty = allViolations.reduce((sum, v) => sum + v.penalty, 0);
  const score = Math.max(0, 100 - totalPenalty);

  const passed = allViolations.length === 0;

  return {
    passed,
    violations: allViolations,
    score,
    findingsValidation: findingsResult.validation,
    mlValidation: mlResult.validation,
  };
}
