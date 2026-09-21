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

export interface SignalEvidence {
  signalType: keyof ConfidenceFactors;
  score: number;
  matchedTerms: string[];
  weight: number;
  contribution: number;
}

export interface EvidenceItem {
  factor: keyof ConfidenceFactors;
  description: string;
  matchedText: string[];
  contribution: number;
}

export interface ScoringResult {
  score: number;
  level: 'high' | 'medium' | 'low';
  breakdown: Record<keyof ConfidenceFactors, number>;
  requiresHumanReview: boolean;
}

export class ConfidenceScorer {
  private defaultWeights: Record<keyof ConfidenceFactors, number> = {
    urlPatternMatch: 0.15,
    titleMatch: 0.20,
    headingMatch: 0.20,
    contentMatch: 0.25,
    metadataMatch: 0.05,
    navigationContext: 0.05,
    crossReferenceMatch: 0.05,
    regulatoryMention: 0.05
  };

  private effectiveWeights: Record<keyof ConfidenceFactors, number>;

  constructor(customWeights?: Partial<Record<keyof ConfidenceFactors, number>>) {
    this.effectiveWeights = {
      ...this.defaultWeights,
      ...(customWeights || {})
    };
  }

  calculate(factors: ConfidenceFactors): ScoringResult {
    let weightedSum = 0;
    const breakdown: Record<keyof ConfidenceFactors, number> = {
      urlPatternMatch: 0,
      titleMatch: 0,
      headingMatch: 0,
      contentMatch: 0,
      metadataMatch: 0,
      navigationContext: 0,
      crossReferenceMatch: 0,
      regulatoryMention: 0
    };

    const factorKeys = Object.keys(factors) as (keyof ConfidenceFactors)[];
    
    for (const key of factorKeys) {
      const value = factors[key];
      const weight = this.effectiveWeights[key] || 0;
      const contribution = value * weight;
      weightedSum += contribution;
      breakdown[key] = parseFloat(contribution.toFixed(3));
    }

    const normalizedScore = Math.min(1.0, Math.max(0.0, weightedSum));

    const level: 'high' | 'medium' | 'low' =
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
    page: Pick<PageContent, 'url' | 'title' | 'headings' | 'textContent' | 'metaDescription' | 'navigationContext'>,
    policyType: string
  ): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

    if (factors.urlPatternMatch > 0.3) {
      try {
        const pathname = new URL(page.url).pathname;
        evidence.push({
          factor: 'urlPatternMatch',
          description: 'URL contains policy-type keywords',
          matchedText: [pathname],
          contribution: parseFloat((factors.urlPatternMatch * this.effectiveWeights.urlPatternMatch).toFixed(3))
        });
      } catch {
        // Invalid URL, skip
      }
    }

    if (factors.titleMatch > 0.3) {
      evidence.push({
        factor: 'titleMatch',
        description: 'Page title indicates policy document',
        matchedText: [page.title],
        contribution: parseFloat((factors.titleMatch * this.effectiveWeights.titleMatch).toFixed(3))
      });
    }

    if (factors.headingMatch > 0.3 && page.headings.length > 0) {
      evidence.push({
        factor: 'headingMatch',
        description: 'Page headings contain policy-related terms',
        matchedText: page.headings.slice(0, 5),
        contribution: parseFloat((factors.headingMatch * this.effectiveWeights.headingMatch).toFixed(3))
      });
    }

    if (factors.contentMatch > 0.3) {
      const preview = page.textContent.substring(0, 200);
      evidence.push({
        factor: 'contentMatch',
        description: 'Page content contains policy-specific language',
        matchedText: [preview + (page.textContent.length > 200 ? '...' : '')],
        contribution: parseFloat((factors.contentMatch * this.effectiveWeights.contentMatch).toFixed(3))
      });
    }

    if (factors.metadataMatch > 0.3 && page.metaDescription) {
      evidence.push({
        factor: 'metadataMatch',
        description: 'Meta description contains policy keywords',
        matchedText: [page.metaDescription],
        contribution: parseFloat((factors.metadataMatch * this.effectiveWeights.metadataMatch).toFixed(3))
      });
    }

    if (factors.navigationContext > 0.3 && page.navigationContext) {
      evidence.push({
        factor: 'navigationContext',
        description: 'Page is located in legal/compliance section',
        matchedText: [page.navigationContext],
        contribution: parseFloat((factors.navigationContext * this.effectiveWeights.navigationContext).toFixed(3))
      });
    }

    if (factors.regulatoryMention > 0.3) {
      evidence.push({
        factor: 'regulatoryMention',
        description: 'Document references specific regulations',
        matchedText: [policyType],
        contribution: parseFloat((factors.regulatoryMention * this.effectiveWeights.regulatoryMention).toFixed(3))
      });
    }

    return evidence;
  }
}