// src/lib/classifier/evidence-tracker.ts

import { EvidenceItem } from './confidence-scorer';

// 1. EXPORT THIS TYPE (Fixes Error 1)
export type DiscoveryMethod = 
  | 'sitemap' 
  | 'robots-txt' 
  | 'footer-link' 
  | 'nav-link' 
  | 'internal-link' 
  | 'structured-data'
  | 'seed'
  | 'internal-crawl';

export interface AuditTrailRecord {
  id: string;
  policyUrl: string;
  classification: string;
  confidenceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  discoveryMethod: string;
  classifiedAt: string;
  evidence: EvidenceItem[];
  requiresReview: boolean;
  classifierVersion: string;
  jurisdiction?: string;
  effectiveDate?: string;
  lastUpdated?: string;
}

export class EvidenceTracker {
  private records: Map<string, AuditTrailRecord> = new Map();
  private version = '1.0.0';

  // Add this method if missing (Fixes Error in policy-classifier.ts)
  getAllRecords(): AuditTrailRecord[] {
    return Array.from(this.records.values());
  }

  // Add this method if missing (Fixes Error in policy-classifier.ts)
  exportToJson(): string {
    return JSON.stringify({
      version: this.version,
      exportedAt: new Date().toISOString(),
      totalRecords: this.records.size,
      records: this.getAllRecords()
    }, null, 2);
  }

  recordDecision(
    url: string,
    classification: string,
    score: number,
    level: 'high' | 'medium' | 'low',
    method: string,
    evidence: EvidenceItem[],
    breakdown: Record<string, number>,
    metadata: {
      requiresHumanReview: boolean;
      reasoning?: string;
      jurisdictionSignals?: string[];
    }
  ): AuditTrailRecord {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const record: AuditTrailRecord = {
      id,
      policyUrl: url,
      classification,
      confidenceScore: score,
      confidenceLevel: level,
      discoveryMethod: method,
      classifiedAt: new Date().toISOString(),
      evidence,
      requiresReview: metadata.requiresHumanReview,
      classifierVersion: this.version,
      jurisdiction: metadata.jurisdictionSignals?.[0],
    };

    this.records.set(id, record);
    return record;
  }

  exportDecisionsJSON(): string {
    return this.exportToJson();
  }
}