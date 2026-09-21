// src/lib/classifier/confidence-scorer.ts

import { PageContent } from '../discovery/types';

export interface ConfidenceFactors {
  urlPatternMatch: number;
  titleMatch: number;
  headingMatch: number;
  contentMatch: number;
  metadataMatch: number;
  navigationContext: number;
  crossReferenceMatch: number;
  regulatoryMention: number;
}

export interface EvidenceItem {
  factor: keyof ConfidenceFactors;
  description: string;
  matchedText: string[];
  contribution: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoringResult {
  score: number;
  level: ConfidenceLevel;
  breakdown: Record<string, number>;
  requiresHumanReview: boolean;
}

export class ConfidenceScorer {
  private weights: Record<keyof ConfidenceFactors, number> = {
    urlPatternMatch: 0.15,
    titleMatch: 0.20,
    headingMatch: 0.20,
    contentMatch: 0.25,
    metadataMatch: 0.05,
    navigationContext: 0.05,
    crossReferenceMatch: 0.05,
    regulatoryMention: 0.05
  };

  private customWeights?: Partial<Record<keyof ConfidenceFactors, number>>;

  constructor(customWeights?: Partial<Record<keyof ConfidenceFactors, number>>) {
    this.customWeights = customWeights;
  }

  calculate(factors: ConfidenceFactors): ScoringResult {
    const effectiveWeights = {
      ...this.weights,
      ...(this.customWeights || {})
    };

    let weightedSum = 0;
    const breakdown: Record<string, number> = {};

    // Explicitly iterate over keys to avoid index signature errors
    const factorKeys = Object.keys(factors) as (keyof ConfidenceFactors)[];
    
    for (const key of factorKeys) {
      const value = factors[key];
      const weight = effectiveWeights[key] || 0;
      const contribution = value * weight;
      
      weightedSum += contribution;
      breakdown[key] = parseFloat(contribution.toFixed(3));
    }

    const normalizedScore = Math.min(1.0, Math.max(0.0, weightedSum));

    const level: ConfidenceLevel =
      normalizedScore >= 0.75 ? 'high' :
      normalizedScore >= 0.50 ? 'medium' : 'low';

    return {
      score: parseFloat(normalizedScore.toFixed(3)),
      level,
      breakdown,
      requiresHumanReview: level === 'low'
    };
  }

  generateEvidence(
    factors: ConfidenceFactors,
    page: Pick<PageContent, 'url' | 'title' | 'headings' | 'content' | 'metaDescription' | 'navigationContext'>,
    policyType: string
  ): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];
    const effectiveWeights = { ...this.weights, ...(this.customWeights || {}) };

    if (factors.urlPatternMatch > 0.3) {
      evidence.push({
        factor: 'urlPatternMatch',
        description: 'URL contains policy-type keywords',
        matchedText: [new URL(page.url).pathname],
        contribution: parseFloat((factors.urlPatternMatch * effectiveWeights.urlPatternMatch).toFixed(3))
      });
    }

    if (factors.titleMatch > 0.3) {
      evidence.push({
        factor: 'titleMatch',
        description: 'Page title indicates policy document',
        matchedText: [page.title],
        contribution: parseFloat((factors.titleMatch * effectiveWeights.titleMatch).toFixed(3))
      });
    }

    if (factors.headingMatch > 0.3 && page.headings && page.headings.length > 0) {
      evidence.push({
        factor: 'headingMatch',
        description: 'Page headings contain policy-related terms',
        matchedText: page.headings.slice(0, 5),
        contribution: parseFloat((factors.headingMatch * effectiveWeights.headingMatch).toFixed(3))
      });
    }

    if (factors.contentMatch > 0.3) {
      const preview = (page.content || '').substring(0, 200);
      evidence.push({
        factor: 'contentMatch',
        description: 'Page content contains policy-specific language',
        matchedText: [preview + '...'],
        contribution: parseFloat((factors.contentMatch * effectiveWeights.contentMatch).toFixed(3))
      });
    }

    if (factors.navigationContext && factors.navigationContext > 0.3) {
      evidence.push({
        factor: 'navigationContext',
        description: 'Page is located in legal/compliance section',
        matchedText: [page.url],
        contribution: parseFloat((factors.navigationContext * effectiveWeights.navigationContext).toFixed(3))
      });
    }

    if (factors.regulatoryMention > 0.3) {
      evidence.push({
        factor: 'regulatoryMention',
        description: 'Document references specific regulations',
        matchedText: [policyType],
        contribution: parseFloat((factors.regulatoryMention * effectiveWeights.regulatoryMention).toFixed(3))
      });
    }

    return evidence;
  }
}