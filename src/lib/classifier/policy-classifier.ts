// src/lib/classifier/policy-classifier.ts
// Multi-signal semantic policy classification engine

import { POLICY_TAXONOMY, getPolicyConfig, type PolicyConfig } from './taxonomy';
import { ConfidenceScorer, type ConfidenceFactors, type SignalEvidence, type ScoringResult } from './confidence-scorer';
import { EvidenceTracker, type DiscoveryMethod, type AuditTrailRecord } from './evidence-tracker';

export interface PageContent {
  url: string;
  title: string;
  textContent: string;
  headings: string[];
  metaDescription?: string;
  metaKeywords?: string;
  links: Array<{ href: string; text: string }>;
  navigationContext?: string;
  html?: string;
}

export interface ClassificationCandidate {
  policyType: string;
  score: number;
  matchedSignals: string[];
}

export interface ClassificationResult {
  /** Primary classification */
  policyType: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Confidence level */
  level: 'high' | 'medium' | 'low';

  /** All candidate policy types with scores */
  allCandidates: ClassificationCandidate[];

  /** Evidence supporting classification */
  evidence: SignalEvidence[];

  /** Score breakdown by signal type */
  scoreBreakdown: Record<string, number>;

  /** Whether human review is recommended */
  requiresHumanReview: boolean;

  /** Alternative classifications considered */
  alternatives?: string[];
}

export interface ClassifierOptions {
  /** Minimum confidence threshold for automatic classification */
  minConfidence?: number;

  /** Maximum number of candidates to return */
  maxCandidates?: number;

  /** Custom weights for scoring */
  customWeights?: Partial<Record<keyof ConfidenceFactors, number>> | null;

  /** Enable detailed logging */
  debug?: boolean;
}

/**
 * Main policy classifier using multi-signal analysis
 */
export class PolicyClassifier {
  private scorer: ConfidenceScorer;
  private tracker: EvidenceTracker;
  private options: Required<ClassifierOptions>;

  constructor(options?: ClassifierOptions) {
    const defaultWeights: Partial<Record<keyof ConfidenceFactors, number>> = {};

    this.options = {
      minConfidence: 0.5,
      maxCandidates: 5,
      customWeights: options?.customWeights ?? defaultWeights,
      debug: false,
      ...options
    };

    this.scorer = new ConfidenceScorer(this.options.customWeights);
    this.tracker = new EvidenceTracker();
  }

  /**
   * Get audit trail records
   */
  getAuditTrail(): AuditTrailRecord[] {
    return this.tracker.getAllRecords();
  }

  /**
   * Export audit trail as JSON string
   */
  exportAuditTrail(): string {
    return this.tracker.exportToJson();
  }

  /**
   * Classify a page's content to determine its policy type
   */
  classify(page: PageContent, discoveryMethod: DiscoveryMethod = 'internal-crawl'): ClassificationResult {
    const candidates = this.evaluateAllPolicyTypes(page);

    if (candidates.length === 0) {
      return this.createUnknownResult(page, discoveryMethod);
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const bestMatch = candidates[0];
    const config = getPolicyConfig(bestMatch.policyType);

    if (!config) {
      return this.createUnknownResult(page, discoveryMethod);
    }

    // Calculate confidence factors
    const factors = this.calculateConfidenceFactors(page, bestMatch.policyType, config);
    const scoringResult = this.scorer.calculate(factors);

    // Generate evidence
    const evidence = this.scorer.generateEvidence(factors, {
      url: page.url,
      title: page.title,
      headings: page.headings,
      content: page.textContent,
      metaDescription: page.metaDescription,
      navigationContext: page.navigationContext
    });

    // Record decision in audit trail
    this.tracker.recordDecision(
      page.url,
      bestMatch.policyType,
      scoringResult.score,
      scoringResult.level,
      discoveryMethod,
      evidence,
      scoringResult.breakdown,
      {
        requiresHumanReview: scoringResult.requiresHumanReview || scoringResult.score < this.options.minConfidence,
        reasoning: `Best match: ${bestMatch.policyType} (${(bestMatch.score * 100).toFixed(1)}%), ` +
                   `Confidence: ${(scoringResult.score * 100).toFixed(1)}%`,
        jurisdictionSignals: this.extractJurisdictionSignals(page.textContent)
      }
    );

    return {
      policyType: bestMatch.policyType,
      confidence: scoringResult.score,
      level: scoringResult.level,
      allCandidates: candidates.slice(0, this.options.maxCandidates),
      evidence,
      scoreBreakdown: scoringResult.breakdown,
      requiresHumanReview: scoringResult.requiresHumanReview || scoringResult.score < this.options.minConfidence,
      alternatives: candidates.slice(1, 4).map(c => c.policyType)
    };
  }

  /**
   * Evaluate page against all policy types in taxonomy
   */
  private evaluateAllPolicyTypes(page: PageContent): ClassificationCandidate[] {
    const candidates: ClassificationCandidate[] = [];
    const combinedText = this.combinePageText(page);

    for (const [policyType, config] of Object.entries(POLICY_TAXONOMY)) {
      const signals = this.matchPolicyType(combinedText, page, config);

      if (signals.length > 0) {
        const avgScore = signals.reduce((sum, s) => sum + s, 0) / signals.length;
        const maxScore = Math.max(...signals);

        // Weighted combination of average and max
        const finalScore = (avgScore * 0.6) + (maxScore * 0.4);

        candidates.push({
          policyType,
          score: finalScore,
          matchedSignals: signals.map(s => s.toFixed(2))
        });
      }
    }

    return candidates.filter(c => c.score >= 0.2); // Filter low-confidence matches
  }

  /**
   * Match a specific policy type against page content
   */
  private matchPolicyType(
    combinedText: string,
    page: PageContent,
    config: PolicyConfig
  ): number[] {
    const scores: number[] = [];

    // 1. URL pattern matching (weak signal)
    const urlScore = this.matchUrlPatterns(page.url, config);
    if (urlScore > 0.3) scores.push(urlScore * 0.5); // Downweight URL-only matches

    // 2. Title matching (strong signal)
    const titleScore = this.matchTitle(page.title, config);
    if (titleScore > 0.3) scores.push(titleScore);

    // 3. Headings matching (strong signal)
    const headingScore = this.matchHeadings(page.headings, config);
    if (headingScore > 0.3) scores.push(headingScore);

    // 4. Content keyword matching (strongest signal)
    const contentScore = this.matchContentKeywords(combinedText, config);
    if (contentScore > 0.2) scores.push(contentScore);

    // 5. Alias matching in text
    const aliasScore = this.matchAliases(combinedText, config);
    if (aliasScore > 0.3) scores.push(aliasScore);

    // 6. Regulatory reference matching
    const regulatoryScore = this.matchRegulatoryReferences(combinedText, config);
    if (regulatoryScore > 0.2) scores.push(regulatoryScore);

    return scores;
  }

  /**
   * Match URL patterns
   */
  private matchUrlPatterns(url: string, config: PolicyConfig): number {
    const urlLower = url.toLowerCase();
    const pathname = new URL(url, 'https://example.com').pathname.toLowerCase();

    let score = 0;

    // Check configured URL patterns if they exist in config
    if ('urlPatterns' in config && Array.isArray(config.urlPatterns)) {
      for (const pattern of config.urlPatterns) {
        if (pathname.includes(pattern.toLowerCase())) {
          score = Math.max(score, 0.8);
          break;
        }
      }
    }

    // Check for policy type name in URL (using the key from taxonomy as fallback)
    // We try to derive a slug from the first alias or name
    const typeName = config.name.toLowerCase().replace(/[^a-z]/g, '-');
    if (pathname.includes(typeName)) {
      score = Math.max(score, 0.7);
    }

    // Check aliases in URL
    for (const alias of config.aliases) {
      const aliasSlug = alias.toLowerCase().replace(/[^a-z]/g, '-');
      if (pathname.includes(aliasSlug)) {
        score = Math.max(score, 0.6);
        break;
      }
    }

    return score;
  }

  /**
   * Match page title
   */
  private matchTitle(title: string, config: PolicyConfig): number {
    const titleLower = title.toLowerCase();

    // Exact match with policy name
    if (titleLower.includes(config.name.toLowerCase())) {
      return 0.95;
    }

    // Match with aliases
    for (const alias of config.aliases) {
      if (titleLower.includes(alias.toLowerCase())) {
        return 0.9;
      }
    }

    // Partial match with keywords
    const keywordMatches = config.keywords.filter(kw => titleLower.includes(kw.toLowerCase()));
    if (keywordMatches.length >= 2) {
      return 0.7;
    } else if (keywordMatches.length === 1) {
      return 0.5;
    }

    return 0;
  }

  /**
   * Match page headings
   */
  private matchHeadings(headings: string[], config: PolicyConfig): number {
    const combinedHeadings = headings.join(' ').toLowerCase();

    // Match policy name in headings
    if (combinedHeadings.includes(config.name.toLowerCase())) {
      return 0.9;
    }

    // Match aliases in headings
    for (const alias of config.aliases) {
      if (combinedHeadings.includes(alias.toLowerCase())) {
        return 0.85;
      }
    }

    // Count keyword matches in headings
    let keywordCount = 0;
    for (const kw of config.keywords) {
      if (combinedHeadings.includes(kw.toLowerCase())) {
        keywordCount++;
      }
    }

    if (keywordCount >= 3) return 0.8;
    if (keywordCount >= 2) return 0.6;
    if (keywordCount >= 1) return 0.4;

    return 0;
  }

  /**
   * Match content keywords
   */
  private matchContentKeywords(content: string, config: PolicyConfig): number {
    const contentLower = content.toLowerCase();
    const totalWords = content.split(/\s+/).length;

    if (totalWords < 50) {
      // Too short to be a policy document
      return 0;
    }

    // Count keyword matches
    let matchCount = 0;
    for (const kw of config.keywords) {
      try {
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(contentLower)) {
          matchCount++;
        }
      } catch (e) {
        // Fallback for invalid regex chars
        if (contentLower.includes(kw.toLowerCase())) {
          matchCount++;
        }
      }
    }

    const keywordRatio = matchCount / config.keywords.length;

    // Also check for policy structure indicators
    const hasPolicyStructure =
      contentLower.includes('effective date') ||
      contentLower.includes('last updated') ||
      contentLower.includes('section') ||
      contentLower.includes('article') ||
      contentLower.includes('clause');

    let baseScore = keywordRatio;
    if (hasPolicyStructure) {
      baseScore = Math.min(1, baseScore + 0.1);
    }

    return baseScore;
  }

  /**
   * Match aliases in text
   */
  private matchAliases(content: string, config: PolicyConfig): number {
    const contentLower = content.toLowerCase();

    for (const alias of config.aliases) {
      try {
        const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(contentLower)) {
          return 0.7;
        }
      } catch (e) {
        if (contentLower.includes(alias.toLowerCase())) {
          return 0.7;
        }
      }
    }

    return 0;
  }

  /**
   * Match regulatory references
   */
  private matchRegulatoryReferences(content: string, config: PolicyConfig): number {
    if (config.regulatoryLinks.length === 0) {
      return 0;
    }

    const contentLower = content.toLowerCase();
    let matchCount = 0;

    for (const regulation of config.regulatoryLinks) {
      try {
        const regex = new RegExp(`\\b${regulation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(contentLower)) {
          matchCount++;
        }
      } catch (e) {
        if (contentLower.includes(regulation.toLowerCase())) {
          matchCount++;
        }
      }
    }

    const ratio = matchCount / config.regulatoryLinks.length;
    return ratio > 0 ? Math.min(1, ratio + 0.2) : 0;
  }

  /**
   * Combine all text from page for analysis
   */
  private combinePageText(page: PageContent): string {
    return [
      page.title,
      page.metaDescription || '',
      page.metaKeywords || '',
      page.headings.join(' '),
      page.textContent
    ].filter(Boolean).join(' ');
  }

  /**
   * Calculate confidence factors for scoring
   */
  private calculateConfidenceFactors(
    page: PageContent,
    policyType: string,
    config?: PolicyConfig
  ): ConfidenceFactors {
    if (!config) {
      return {
        urlPatternMatch: 0,
        titleMatch: 0,
        headingMatch: 0,
        contentMatch: 0,
        metadataMatch: 0,
        navigationContext: 0,
        crossReferenceMatch: 0,
        regulatoryMention: 0
      };
    }

    const combinedText = this.combinePageText(page);

    return {
      urlPatternMatch: this.matchUrlPatterns(page.url, config),
      titleMatch: this.matchTitle(page.title, config),
      headingMatch: this.matchHeadings(page.headings, config),
      contentMatch: this.matchContentKeywords(combinedText, config),
      metadataMatch: page.metaDescription && combinedText.toLowerCase().includes(config.name.toLowerCase()) ? 0.5 : 0,
      navigationContext: page.navigationContext ? this.matchNavigationContext(page.navigationContext, config) : 0,
      crossReferenceMatch: 0, // Would need link graph analysis
      regulatoryMention: config.regulatoryLinks.length > 0 ?
        this.matchRegulatoryReferences(combinedText, config) : 0
    };
  }

  /**
   * Match navigation context
   */
  private matchNavigationContext(context: string, config: PolicyConfig): number {
    const contextLower = context.toLowerCase();

    // Check if context suggests legal/compliance section
    const legalContextIndicators = ['legal', 'compliance', 'policies', 'terms', 'privacy'];
    const hasLegalContext = legalContextIndicators.some(ind => contextLower.includes(ind));

    if (!hasLegalContext) {
      return 0;
    }

    // Boost if policy name appears in context
    if (contextLower.includes(config.name.toLowerCase())) {
      return 0.9;
    }

    return 0.5;
  }

  /**
   * Extract jurisdiction signals from content
   */
  private extractJurisdictionSignals(content: string): string[] {
    const signals: string[] = [];

    const jurisdictionPatterns = [
      { pattern: /\b(GDPR|General Data Protection Regulation)\b/gi, signal: 'EU-GDPR' },
      { pattern: /\b(CCPA|California Consumer Privacy Act)\b/gi, signal: 'US-CA' },
      { pattern: /\b(DPDP|Digital Personal Data Protection)\b/gi, signal: 'IN-DPDP' },
      { pattern: /\b(UK GDPR)\b/gi, signal: 'UK-GDPR' },
      { pattern: /\b(LGPD|Lei Geral de Proteção de Dados)\b/gi, signal: 'BR-LGPD' },
      { pattern: /\b(PIPEDA)\b/gi, signal: 'CA-PIPEDA' },
      { pattern: /\b(HIPAA)\b/gi, signal: 'US-HIPAA' },
      { pattern: /\b(DMCA)\b/gi, signal: 'US-DMCA' },
      { pattern: /\b(ePrivacy Directive)\b/gi, signal: 'EU-ePrivacy' },
    ];

    for (const { pattern, signal } of jurisdictionPatterns) {
      if (pattern.test(content)) {
        signals.push(signal);
      }
    }

    return [...new Set(signals)];
  }

  /**
   * Create result for unknown/unclassifiable pages
   */
  private createUnknownResult(page: PageContent, discoveryMethod: DiscoveryMethod): ClassificationResult {
    const result: ClassificationResult = {
      policyType: 'unknown',
      confidence: 0,
      level: 'low',
      allCandidates: [],
      evidence: [],
      scoreBreakdown: {
        'url-pattern': 0,
        'title': 0,
        'headings': 0,
        'content': 0,
        'metadata': 0,
        'navigation-context': 0,
        'cross-reference': 0,
        'regulatory-mention': 0
      },
      requiresHumanReview: true
    };

    // Record as unknown classification
    this.tracker.recordDecision(
      page.url,
      'unknown',
      0,
      'low',
      discoveryMethod,
      [],
      result.scoreBreakdown,
      {
        requiresHumanReview: true,
        reasoning: 'No matching policy type found in taxonomy'
      }
    );

    return result;
  }

  /**
   * Get the evidence tracker instance
   */
  getTracker(): EvidenceTracker {
    return this.tracker;
  }

  /**
   * Export all recorded decisions
   */
  exportDecisions(): string {
    return this.tracker.exportDecisionsJSON();
  }
}

/**
 * Quick classification function for simple use cases
 */
export function quickClassify(page: PageContent): ClassificationResult {
  const classifier = new PolicyClassifier();
  return classifier.classify(page);
}