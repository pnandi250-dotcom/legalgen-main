/**
 * LegalGen V2 - Risk Calculator
 * 
 * Calculates compliance risk scores based on:
 * - Applicable obligations
 * - Control implementation status
 * - Evidence availability
 * - Severity weights
 */

import {
    Obligation,
    SeverityLevel,
    RiskCategory,
    SAMPLE_OBLIGATIONS
} from './regulatory-types';

import {
    ApplicabilityAnalysis,
    ApplicabilityResult,
} from './applicability-engine';
import {
    ApplicabilityStatus
} from './regulatory-types';
/**
 * Control definition (local interface since not in regulatory-types)
 */
export interface Control {
    id: string;
    name: string;
    description: string;
    category: string;
}

/**
 * Evidence definition (local interface since not in regulatory-types)
 */
export interface Evidence {
    id: string;
    type: string;
    description: string;
    collectedAt: Date;
    verified: boolean;
}

/**
 * Risk score breakdown
 */
export interface RiskScoreBreakdown {
    overallScore: number; // 0-100, higher = more risk
    level: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
    categories: CategoryRiskBreakdown[];
    topRisks: RiskAssessment[];
    recommendations: Recommendation[];
}

/**
 * Risk per category
 */
export interface CategoryRiskBreakdown {
    category: RiskCategory;
    score: number;
    maxScore: number;
    obligationCount: number;
    controlledCount: number;
    partiallyControlledCount: number;
    uncontrolledCount: number;
}

/**
 * Single risk assessment
 */
export interface RiskAssessment {
    obligation: Obligation;
    applicability: ApplicabilityStatus;
    inherentRisk: number; // 0-100 before controls
    residualRisk: number; // 0-100 after controls
    controlEffectiveness: number; // 0-100
    keyControls: Control[];
    gaps: string[];
}

/**
 * Recommendation
 */
export interface Recommendation {
    priority: 'immediate' | 'short-term' | 'long-term';
    area: string;
    action: string;
    impact: string;
    effort: 'small' | 'medium' | 'large';
    reducesRiskBy: number; // percentage points
}

/**
 * Control assessment input
 */
export interface ControlAssessment {
    obligationId: string;
    control: Control;
    implemented: boolean;
    effective: boolean; // Is it working as intended?
    evidence?: Evidence;
    lastReviewed?: Date;
    notes?: string;
}

// ============================================================================
// Risk Calculation Constants
// ============================================================================

const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    informational: 10
};

const APPLICABILITY_MULTIPLIER: Record<ApplicabilityStatus, number> = {
    APPLIES: 1.0,
    POTENTIALLY_APPLIES: 0.7,
    NEEDS_REVIEW: 0.5,
    DOES_NOT_APPLY: 0,
    UNKNOWN: 0.3
};

const CONTROL_EFFECTIVENESS_RATES: Record<string, number> = {
    'encryption-at-rest': 0.85,
    'encryption-in-transit': 0.90,
    'access-controls': 0.75,
    'audit-logging': 0.60,
    'consent-management': 0.80,
    'data-retention-policy': 0.65,
    'incident-response-plan': 0.70,
    'dpa-signed': 0.85,
    'privacy-policy': 0.50,
    'cookie-consent': 0.70,
    'dpo-appointed': 0.60,
    'pia-conducted': 0.55,
    'vendor-assessment': 0.70,
    'training-program': 0.50
};

// ============================================================================
// Main Risk Calculator
// ============================================================================

/**
 * Calculate comprehensive risk score
 */
export function calculateRiskScore(
    applicabilityAnalysis: ApplicabilityAnalysis,
    controlAssessments: ControlAssessment[] = []
): RiskScoreBreakdown {
    const assessments = assessAllObligations(applicabilityAnalysis, controlAssessments);
    const categoryBreakdowns = calculateCategoryBreakdowns(assessments);
    const overallScore = calculateOverallScore(assessments);
    const recommendations = generateRecommendations(assessments);

    // Sort risks by residual risk (highest first)
    const topRisks = assessments
        .sort((a, b) => b.residualRisk - a.residualRisk)
        .slice(0, 10);

    return {
        overallScore,
        level: getRiskLevel(overallScore),
        categories: categoryBreakdowns,
        topRisks,
        recommendations: recommendations.sort((a, b) => {
            const priorityOrder = { immediate: 0, 'short-term': 1, 'long-term': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
    };
}

/**
 * Assess individual obligations
 */
function assessAllObligations(
    analysis: ApplicabilityAnalysis,
    controlAssessments: ControlAssessment[]
): RiskAssessment[] {
    const assessments: RiskAssessment[] = [];

    for (const result of analysis.results) {
        if (result.status === 'DOES_NOT_APPLY') continue;

        const obligation = SAMPLE_OBLIGATIONS.find(o => o.id === result.obligationId);
        if (!obligation) continue;

        // Find controls for this obligation
        const obligationControls = controlAssessments.filter(
            c => c.obligationId === result.obligationId
        );

        const assessment = assessSingleObligation(obligation, result, obligationControls);
        assessments.push(assessment);
    }

    return assessments;
}

/**
 * Assess single obligation risk
 */
function assessSingleObligation(
    obligation: Obligation,
    applicability: ApplicabilityResult,
    controlAssessments: ControlAssessment[]
): RiskAssessment {
    // Calculate inherent risk (before controls)
    const baseRisk = SEVERITY_WEIGHTS[obligation.severity];
    const applicabilityFactor = APPLICABILITY_MULTIPLIER[applicability.status];
    const confidenceFactor = applicability.confidence;

    const inherentRisk = Math.round(baseRisk * applicabilityFactor * confidenceFactor);

    // Calculate control effectiveness
    let controlEffectiveness = 0;
    const implementedControls: Control[] = [];
    const gaps: string[] = [];

    for (const ca of controlAssessments) {
        if (ca.implemented && ca.effective) {
            const effectivenessRate = CONTROL_EFFECTIVENESS_RATES[ca.control.id] || 0.5;
            controlEffectiveness = Math.max(controlEffectiveness, effectivenessRate);
            implementedControls.push(ca.control);
        } else if (ca.implemented && !ca.effective) {
            gaps.push(`${ca.control.name}: Implemented but not effective${ca.notes ? ` - ${ca.notes}` : ''}`);
        } else {
            gaps.push(`${ca.control.name}: Not implemented`);
        }
    }

    // If no controls at all, note that
    if (controlAssessments.length === 0) {
        gaps.push('No controls identified for this obligation');
    }

    // Also add obligation-specific gap checks
    if (obligation.controlRequirements.length > 0) {
        for (const req of obligation.controlRequirements) {
            const hasControl = controlAssessments.some(c => c.control.id === req);
            if (!hasControl) {
                gaps.push(`Missing required control: ${req}`);
            }
        }
    }

    // Calculate residual risk (after controls)
    const riskReduction = inherentRisk * controlEffectiveness;
    const residualRisk = Math.max(0, Math.round(inherentRisk - riskReduction));

    return {
        obligation,
        applicability: applicability.status,
        inherentRisk,
        residualRisk,
        controlEffectiveness: Math.round(controlEffectiveness * 100),
        keyControls: implementedControls,
        gaps
    };
}

/**
 * Calculate category breakdowns
 */
function calculateCategoryBreakdowns(
    assessments: RiskAssessment[]
): CategoryRiskBreakdown[] {
    const categoryMap = new Map<RiskCategory, {
        scores: number[];
        obligations: RiskAssessment[];
    }>();

    for (const assessment of assessments) {
        const category = assessment.obligation.category;

        if (!categoryMap.has(category)) {
            categoryMap.set(category, { scores: [], obligations: [] });
        }

        const entry = categoryMap.get(category)!;
        entry.scores.push(assessment.residualRisk);
        entry.obligations.push(assessment);
    }

    const breakdowns: CategoryRiskBreakdown[] = [];

    for (const [category, data] of categoryMap) {
        const avgScore = Math.round(
            data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
        );
        const maxScore = Math.max(...data.scores);

        const controlled = data.obligations.filter(o => o.residualRisk < 30).length;
        const partiallyControlled = data.obligations.filter(
            o => o.residualRisk >= 30 && o.residualRisk < 60
        ).length;
        const uncontrolled = data.obligations.filter(o => o.residualRisk >= 60).length;

        breakdowns.push({
            category,
            score: avgScore,
            maxScore,
            obligationCount: data.obligations.length,
            controlledCount: controlled,
            partiallyControlledCount: partiallyControlled,
            uncontrolledCount: uncontrolled
        });
    }

    // Sort by score (highest risk first)
    return breakdowns.sort((a, b) => b.score - a.score);
}

/**
 * Calculate overall risk score
 */
function calculateOverallScore(assessments: RiskAssessment[]): number {
    if (assessments.length === 0) return 0;

    // Weighted average by inherent risk (more important obligations count more)
    const totalWeight = assessments.reduce((sum, a) => sum + a.inherentRisk, 0);

    if (totalWeight === 0) return 0;

    const weightedSum = assessments.reduce(
        (sum, a) => sum + (a.residualRisk * a.inherentRisk),
        0
    );

    return Math.round(weightedSum / totalWeight);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' | 'minimal' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
}

/**
 * Generate recommendations based on gaps
 */
function generateRecommendations(
    assessments: RiskAssessment[]
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Group gaps by theme
    const gapThemes = new Map<string, {
        count: number;
        maxRiskReduction: number;
        examples: string[];
    }>();

    for (const assessment of assessments) {
        for (const gap of assessment.gaps) {
            // Extract theme from gap
            const theme = extractTheme(gap);

            if (!gapThemes.has(theme)) {
                gapThemes.set(theme, { count: 0, maxRiskReduction: 0, examples: [] });
            }

            const entry = gapThemes.get(theme)!;
            entry.count++;
            entry.maxRiskReduction = Math.max(
                entry.maxRiskReduction,
                assessment.inherentRisk - assessment.residualRisk
            );

            if (entry.examples.length < 3) {
                entry.examples.push(`${assessment.obligation.title}: ${gap}`);
            }
        }
    }

    // Generate recommendations from themes
    for (const [theme, data] of gapThemes) {
        let priority: 'immediate' | 'short-term' | 'long-term';
        let effort: 'small' | 'medium' | 'large';

        if (data.maxRiskReduction > 40) {
            priority = 'immediate';
            effort = 'large';
        } else if (data.maxRiskReduction > 20) {
            priority = 'short-term';
            effort = 'medium';
        } else {
            priority = 'long-term';
            effort = 'small';
        }

        recommendations.push({
            priority,
            area: theme,
            action: generateActionForTheme(theme, data),
            impact: `Addresses ${data.count} gap(s) across multiple obligations`,
            effort,
            reducesRiskBy: Math.min(data.maxRiskReduction, 30)
        });
    }

    return recommendations;
}

/**
 * Extract theme from gap text
 */
function extractTheme(gap: string): string {
    const lowerGap = gap.toLowerCase();

    if (lowerGap.includes('encryption') || lowerGap.includes('security')) {
        return 'Data Security';
    }
    if (lowerGap.includes('consent') || lowerGap.includes('privacy')) {
        return 'Consent Management';
    }
    if (lowerGap.includes('policy') || lowerGap.includes('documentation')) {
        return 'Policy & Documentation';
    }
    if (lowerGap.includes('training') || lowerGap.includes('awareness')) {
        return 'Training & Awareness';
    }
    if (lowerGap.includes('vendor') || lowerGap.includes('third-party')) {
        return 'Vendor Management';
    }
    if (lowerGap.includes('incident') || lowerGap.includes('breach')) {
        return 'Incident Response';
    }
    if (lowerGap.includes('dpo') || lowerGap.includes('protection officer')) {
        return 'Governance & Accountability';
    }

    return 'General Compliance';
}

/**
 * Generate action text for theme
 */
function generateActionForTheme(
    theme: string,
    data: { count: number; examples: string[] }
): string {
    const actions: Record<string, string> = {
        'Data Security': 'Implement encryption, access controls, and security monitoring for sensitive data',
        'Consent Management': 'Deploy consent management platform with granular controls and audit trails',
        'Policy & Documentation': 'Create and maintain comprehensive policies covering identified gaps',
        'Training & Awareness': 'Develop and deliver role-based privacy and security training program',
        'Vendor Management': 'Establish vendor assessment program with security questionnaires and DPAs',
        'Incident Response': 'Create and test incident response plan with defined timelines and procedures',
        'Governance & Accountability': 'Appoint Data Protection Officer and establish governance framework',
        'General Compliance': 'Review and address compliance gaps through systematic remediation'
    };

    return actions[theme] || 'Review and address compliance gaps';
}

// ============================================================================
// Quick Risk Assessment Helpers
// ============================================================================

/**
 * Quick risk score for single obligation
 */
export function quickRiskAssessment(
    obligationId: string,
    isImplemented: boolean,
    isEffective: boolean
): {
    inherentRisk: number;
    residualRisk: number;
    level: string;
} {
    const obligation = SAMPLE_OBLIGATIONS.find(o => o.id === obligationId);

    if (!obligation) {
        return { inherentRisk: 0, residualRisk: 0, level: 'unknown' };
    }

    const inherentRisk = SEVERITY_WEIGHTS[obligation.severity];

    let residualRisk = inherentRisk;
    if (isImplemented && isEffective) {
        const effectiveness = CONTROL_EFFECTIVENESS_RATES[obligation.controlRequirements[0]] || 0.5;
        residualRisk = Math.round(inherentRisk * (1 - effectiveness));
    } else if (isImplemented) {
        residualRisk = Math.round(inherentRisk * 0.8); // Partial credit
    }

    return {
        inherentRisk,
        residualRisk,
        level: getRiskLevel(residualRisk)
    };
}

/**
 * Estimate compliance investment
 */
export function estimateComplianceInvestment(
    analysis: ApplicabilityAnalysis,
    targetRiskLevel: number = 40
): {
    estimatedHours: number;
    estimatedCostRange: { min: number; max: number };
    phases: Array<{
        name: string;
        hours: number;
        cost: { min: number; max: number };
        riskReduction: number;
    }>;
} {
    const uncontrolledCount = analysis.results.filter(
        r => r.status === 'APPLIES' || r.status === 'POTENTIALLY_APPLIES'
    ).length;

    // Base estimates per obligation type
    const hoursPerObligation: Record<SeverityLevel, number> = {
        critical: 80,
        high: 50,
        medium: 25,
        low: 10,
        informational: 5
    };

    let totalHours = 0;
    const phases: Array<{
        name: string;
        hours: number;
        cost: { min: number; max: number };
        riskReduction: number;
    }> = [];

    // Phase 1: Critical items
    const criticalItems = analysis.applicableObligations.filter(o => o.severity === 'critical').length;
    const phase1Hours = criticalItems * hoursPerObligation.critical;
    totalHours += phase1Hours;
    phases.push({
        name: 'Critical Controls',
        hours: phase1Hours,
        cost: { min: phase1Hours * 100, max: phase1Hours * 200 },
        riskReduction: 35
    });

    // Phase 2: High priority
    const highItems = analysis.applicableObligations.filter(o => o.severity === 'high').length;
    const phase2Hours = highItems * hoursPerObligation.high;
    totalHours += phase2Hours;
    phases.push({
        name: 'High Priority Items',
        hours: phase2Hours,
        cost: { min: phase2Hours * 80, max: phase2Hours * 150 },
        riskReduction: 25
    });

    // Phase 3: Medium priority
    const mediumItems = [...analysis.applicableObligations, ...analysis.potentiallyApplicableObligations]
        .filter(o => o.severity === 'medium').length;
    const phase3Hours = mediumItems * hoursPerObligation.medium;
    totalHours += phase3Hours;
    phases.push({
        name: 'Medium Priority Items',
        hours: phase3Hours,
        cost: { min: phase3Hours * 60, max: phase3Hours * 120 },
        riskReduction: 20
    });

    // Phase 4: Documentation & training
    const phase4Hours = 40;
    totalHours += phase4Hours;
    phases.push({
        name: 'Documentation & Training',
        hours: phase4Hours,
        cost: { min: phase4Hours * 50, max: phase4Hours * 100 },
        riskReduction: 10
    });

    const totalCostMin = phases.reduce((sum, p) => sum + p.cost.min, 0);
    const totalCostMax = phases.reduce((sum, p) => sum + p.cost.max, 0);

    return {
        estimatedHours: totalHours,
        estimatedCostRange: { min: totalCostMin, max: totalCostMax },
        phases
    };
}

/**
 * Generate executive summary
 */
export function generateExecutiveSummary(
    riskScore: RiskScoreBreakdown,
    analysis: ApplicabilityAnalysis
): {
    headline: string;
    keyPoints: string[];
    attentionRequired: boolean;
    nextSteps: string[];
} {
    const { overallScore, level, topRisks, recommendations } = riskScore;

    const headlines: Record<string, string> = {
        critical: '🚨 Critical Compliance Risks Detected - Immediate Action Required',
        high: '⚠️ Significant Compliance Gaps - Urgent Attention Needed',
        moderate: '📋 Moderate Compliance Posture - Improvement Recommended',
        low: '✅ Generally Compliant - Minor Enhancements Possible',
        minimal: '🌟 Strong Compliance Position - Maintain Current Practices'
    };

    const keyPoints: string[] = [
        `Overall Risk Score: ${overallScore}/100 (${level.toUpperCase()})`,
        `${analysis.summary.applies} obligations fully apply to your business`,
        `${analysis.summary.potentiallyApplies} obligations may apply (needs review)`,
        `${topRisks.length > 0 ? topRisks.length : 0} high-risk areas identified`,
        recommendations.length > 0
            ? `${recommendations.filter(r => r.priority === 'immediate').length} immediate actions recommended`
            : 'No critical immediate actions'
    ];

    const attentionRequired = level === 'critical' || level === 'high';

    const nextSteps = recommendations.slice(0, 5).map(r =>
        `[${r.priority.toUpperCase()}] ${r.action}`
    );

    if (nextSteps.length === 0) {
        nextSteps.push('Continue monitoring regulatory changes');
        nextSteps.push('Schedule periodic compliance review');
    }

    return {
        headline: headlines[level] || headlines.moderate,
        keyPoints,
        attentionRequired,
        nextSteps
    };
}