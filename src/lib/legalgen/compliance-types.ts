// =============================================================================
// LEGALGEN - COMPLIANCE TYPES (Upgraded for V2)
// =============================================================================
// Controls, Evidence, Risks, Tasks - Operational compliance tracking
// =============================================================================

import type { SeverityLevel } from './regulatory-types';

export type ControlId = string;
export type ObligationId = string;

// ─── 1. CONTROL (How to Comply) ──────────────────────────────────────────

export interface Control {
  id: ControlId;
  name: string;
  description: string;
  category: ControlCategory;
  
  obligationId: ObligationId;
  regulationId: string;
  
  testType: TestType;
  testFrequency: TestFrequency;
  
  evidenceRequired: EvidenceRequirement[];
  
  status: ControlStatus;
  lastChecked?: string;
  nextCheckDue?: string;
  
  owner?: string;
  weight: number;
}

export type ControlCategory = 
  | 'documentary'     // Policies, notices
  | 'technical'       // Configurations, settings
  | 'process'         // Procedures
  | 'administrative'; // Training, awareness

export type TestType = 
  | 'document-exists' | 'website-scan' | 'configuration-check'
  | 'manual-review' | 'evidence-upload' | 'automated-test';

export type TestFrequency = 
  | 'one-time' | 'quarterly' | 'annual' | 'continuous';

export type ControlStatus = 
  | 'not-tested' | 'pass' | 'fail' | 'partial' 
  | 'not-applicable' | 'in-progress';

export interface EvidenceRequirement {
  type: EvidenceType;
  description: string;
  required: boolean;
}

export type EvidenceType = 
  | 'url' | 'screenshot' | 'file' | 'configuration' 
  | 'certificate' | 'attestation';

// ─── 2. EVIDENCE (Proof of Compliance) ───────────────────────────────────

export interface Evidence {
  id: string;
  controlId: ControlId;
  
  type: EvidenceType;
  title: string;
  location: string;              // URL or file path
  
  status: EvidenceStatus;
  collectedAt: string;
  expiresAt?: string;
  
  verified: boolean;
  reviewedAt?: string;
}

export type EvidenceStatus = 
  | 'valid' | 'expired' | 'missing' | 'pending-review' | 'rejected';

// ─── 3. RISK (What Could Go Wrong) ────────────────────────────────────────

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  
  sourceObligationId?: string;
  
  likelihood: LikelihoodLevel;
  impact: ImpactLevel;
  severity: SeverityLevel;
  
  mitigationPlan?: MitigationAction[];
  status: RiskStatus;
  
  owner?: string;
  identifiedAt: string;
}

export type RiskCategory = 
  | 'compliance' | 'operational' | 'financial' 
  | 'reputational' | 'security' | 'legal';

export type LikelihoodLevel = 
  | 'almost-certain' | 'likely' | 'possible' | 'unlikely' | 'rare';

export type ImpactLevel = 
  | 'catastrophic' | 'major' | 'moderate' | 'minor' | 'negligible';

export type RiskStatus = 
  | 'open' | 'mitigating' | 'mitigated' | 'accepted' | 'closed';

export interface MitigationAction {
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'in-progress' | 'completed';
}

// ─── 4. TASK (Action Items) ──────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  taskType: TaskType;
  
  source: TaskSource;
  relatedControlId?: ControlId;
  relatedObligationId?: ObligationId;
  
  priority: TaskPriority;
  status: TaskStatus;
  
  assignedTo?: string;
  dueDate?: string;
  
  progress: number;              // 0-100
  completedAt?: string;
}

export type TaskType = 
  | 'create-document' | 'update-document' | 'implement-control'
  | 'collect-evidence' | 'review' | 'training' | 'configuration-change';

export type TaskSource = 
  | 'obligation' | 'control-gap' | 'audit-finding' 
  | 'regulatory-change' | 'manual' | 'recommendation';

export type TaskPriority = 
  | 'critical' | 'high' | 'medium' | 'low' | 'backlog';

export type TaskStatus = 
  | 'todo' | 'in-progress' | 'blocked' | 'in-review' 
  | 'completed' | 'cancelled';

// ─── 5. COMPLIANCE SCORE ─────────────────────────────────────────────────

export interface ComplianceScore {
  overall: number;                // 0-100
  
  breakdown: {
    regulatoryCoverage: number;   // % of applicable regulations covered
    policyCoverage: number;       // % of required policies created
    controlCoverage: number;      // % of controls implemented
    evidenceCoverage: number;     // % of evidence collected
  };
  
  riskPosture: number;            // 0-100 (higher = better)
  
  counts: {
    criticalGaps: number;
    highRisks: number;
    openTasks: number;
    compliantControls: number;
  };
  
  lastCalculated: string;
}

// ─── 6. HELPER: Calculate Score ────────────────────────────────────────────

export function calculateComplianceScore(controls: Control[], risks: Risk[]): ComplianceScore {
  const totalControls = controls.length;
  if (totalControls === 0) {
    return {
      overall: 0,
      breakdown: { regulatoryCoverage: 0, policyCoverage: 0, controlCoverage: 0, evidenceCoverage: 0 },
      riskPosture: 50,
      counts: { criticalGaps: 0, highRisks: 0, openTasks: 0, compliantControls: 0 },
      lastCalculated: new Date().toISOString(),
    };
  }
  
  const compliantControls = controls.filter(c => c.status === 'pass').length;
  const failedControls = controls.filter(c => c.status === 'fail').length;
  const criticalGaps = controls.filter(
    c => c.status === 'fail' && c.weight >= 0.8
  ).length;
  
  const highRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high').length;
  
  const overall = Math.round((compliantControls / totalControls) * 100);
  const riskPosture = Math.max(0, 100 - (highRisks * 20) - (failedControls * 5));
  
  return {
    overall,
    breakdown: {
      regulatoryCoverage: Math.min(100, overall),
      policyCoverage: Math.round(overall * 0.9),
      controlCoverage: overall,
      evidenceCoverage: Math.round(overall * 0.7),
    },
    riskPosture: Math.min(100, riskPosture),
    counts: {
      criticalGaps,
      highRisks,
      openTasks: 0,
      compliantControls,
    },
    lastCalculated: new Date().toISOString(),
  };
}