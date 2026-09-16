'use client';

// src/components/PrivacyHunter.tsx
// Privacy Policy Hunter - UI Component

import React, { useState, useCallback } from 'react';
import { 
  Search, ExternalLink, Shield, Globe, Clock, CheckCircle2, 
  AlertTriangle, Target, Zap, FileText, Loader2, ChevronRight,
  MapPin, Calendar, BarChart3, Eye, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PrivacyPolicyFound {
  url: string;
  confidence: number;
  method: 'url-pattern' | 'html-link' | 'sitemap' | 'robots-txt' | 'api';
  title?: string;
  lastUpdated?: string;
  jurisdiction?: string;
  statusCode?: number;
  responseTime?: number;
}

interface HunterResult {
  targetUrl: string;
  foundPolicies: PrivacyPolicyFound[];
  scanTime: number;
  totalMethodsUsed: number;
  summary: {
    totalFound: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  competitorAnalysis?: {
    hasPrivacyPolicy: boolean;
    jurisdictionDetected: string;
    policyComplexity: 'simple' | 'moderate' | 'complex';
    lastUpdated?: string;
  };
}

const JURISDICTION_CONFIG: Record<string, { flag: string; color: string }> = {
  'EU': { flag: '🇪🇺', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  'US-CA': { flag: '🇺🇸', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  'US': { flag: '🇺🇸', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  'UK': { flag: '🇬🇧', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  'IN': { flag: '🇮🇳', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  'UNKNOWN': { flag: '❓', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'url-pattern': { 
    label: 'URL Pattern', 
    icon: <Target className="w-4 h-4" />, 
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' 
  },
  'html-link': { 
    label: 'HTML Link', 
    icon: <Eye className="w-4 h-4" />, 
    color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' 
  },
  'sitemap': { 
    label: 'Sitemap', 
    icon: <MapPin className="w-4 h-4" />, 
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' 
  },
  'robots-txt': { 
    label: 'Robots.txt', 
    icon: <FileText className="w-4 h-4" />, 
    color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' 
  },
  'api': { 
    label: 'API Detection', 
    icon: <Zap className="w-4 h-4" />, 
    color: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800' 
  },
};

export function PrivacyHunter() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HunterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleHunt = useCallback(async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/hunt-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan website');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950';
    if (confidence >= 50) return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950';
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 50) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-8 h-8 text-[#DE5117]" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Privacy Policy Hunter 🔍
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Discover hidden privacy policies on any website. Our AI-powered scanner uses 
          4+ detection methods to find even the most concealed privacy documents.
        </p>
      </div>

      {/* Search Input */}
      <Card className="border-[#DE5117]/20 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="url"
                placeholder="Enter website URL (e.g., zerodha.com, amazon.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHunt()}
                className="pl-10 h-12 text-base border-slate-200 focus:border-[#DE5117] focus:ring-[#DE5117]/20"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleHunt}
              disabled={loading || !url.trim()}
              className="h-12 px-8 bg-[#DE5117] hover:bg-[#c44814] text-white font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Hunt Privacy Policy
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 dark:bg-red-950 dark:border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Scan Failed</p>
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Progress */}
          {loading && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Scanning website...</span>
                <span className="flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait
                </span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> URL Patterns
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> HTML Links
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Sitemap
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Robots.txt
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Policies Found</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{result.summary.totalFound}</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">High Confidence</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">{result.summary.highConfidence}</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Scan Time</span>
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">{(result.scanTime / 1000).toFixed(1)}s</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Methods Used</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">{result.totalMethodsUsed}</p>
              </CardContent>
            </Card>
          </div>

          {/* Competitor Analysis */}
          {result.competitorAnalysis && (
            <Card className="border-[#DE5117]/20 bg-gradient-to-br from-[#DE5117]/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-[#DE5117]" />
                  Competitor Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of {new URL(result.targetUrl).hostname}'s privacy compliance posture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</p>
                    <div className="flex items-center gap-2">
                      {result.competitorAnalysis.hasPrivacyPolicy ? (
                        <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="font-semibold text-emerald-700 dark:text-emerald-400">Has Policy</span></>
                      ) : (
                        <><AlertTriangle className="w-4 h-4 text-red-600" /><span className="font-semibold text-red-700 dark:text-red-400">No Policy</span></>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Jurisdiction</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {result.competitorAnalysis.jurisdictionDetected}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Complexity</p>
                    <Badge variant={
                      result.competitorAnalysis.policyComplexity === 'simple' ? 'default' :
                      result.competitorAnalysis.policyComplexity === 'moderate' ? 'secondary' : 'destructive'
                    }>
                      {result.competitorAnalysis.policyComplexity.charAt(0).toUpperCase() + result.competitorAnalysis.policyComplexity.slice(1)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {result.competitorAnalysis.lastUpdated || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Found Policies List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#DE5117]" />
                Discovered Privacy Policies ({result.foundPolicies.length})
              </CardTitle>
              <CardDescription>
                Policies found on {new URL(result.targetUrl).hostname} sorted by confidence score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.foundPolicies.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    No Privacy Policies Found
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    We couldn't find any privacy policies using our detection methods. 
                    The site might not have one, or it could be heavily obfuscated.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.foundPolicies.map((policy, index) => (
                    <div
                      key={policy.url}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#DE5117]/30 hover:shadow-md transition-all space-y-3"
                    >
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">#{index + 1}</span>
                            {policy.title && (
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                {policy.title}
                              </h4>
                            )}
                          </div>
                          <a
                            href={policy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#DE5117] hover:underline truncate block"
                          >
                            {policy.url}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(policy.url)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            {copiedUrl === policy.url ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <a
                            href={policy.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm" className="gap-1">
                              <ExternalLink className="w-4 h-4" />
                              Visit
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Confidence Badge */}
                        <Badge 
                          variant="outline" 
                          className={`${getConfidenceColor(policy.confidence)} border`}
                        >
                          {getConfidenceLabel(policy.confidence)} ({policy.confidence}%)
                        </Badge>

                        {/* Method Badge */}
                        {METHOD_CONFIG[policy.method] && (
                          <Badge variant="outline" className={METHOD_CONFIG[policy.method].color}>
                            {METHOD_CONFIG[policy.method].icon}
                            <span className="ml-1">{METHOD_CONFIG[policy.method].label}</span>
                          </Badge>
                        )}

                        {/* Jurisdiction Badge */}
                        {policy.jurisdiction && JURISDICTION_CONFIG[policy.jurisdiction] && (
                          <Badge variant="outline" className={JURISDICTION_CONFIG[policy.jurisdiction].color}>
                            {JURISDICTION_CONFIG[policy.jurisdiction].flag}
                            <span className="ml-1">{policy.jurisdiction}</span>
                          </Badge>
                        )}

                        {/* Response Time */}
                        {policy.responseTime && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {policy.responseTime}ms
                          </span>
                        )}

                        {/* Status Code */}
                        {policy.statusCode && (
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                            policy.statusCode === 200 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {policy.statusCode}
                          </span>
                        )}
                      </div>

                      {/* Last Updated */}
                      {policy.lastUpdated && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last updated: {policy.lastUpdated}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => { setResult(null); setError(null); }}
              className="gap-2"
            >
              New Search
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`https://legalgen.in?compare=${encodeURIComponent(result.targetUrl)}`, '_blank')}
            >
              Compare With My Policy
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Feature Info */}
      {!result && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">URL Patterns</h4>
              <p className="text-xs text-slate-500 mt-1">Tests 20+ common privacy URL patterns</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">HTML Scraping</h4>
              <p className="text-xs text-slate-500 mt-1">Scans page links for privacy keywords</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Sitemap Analysis</h4>
              <p className="text-xs text-slate-500 mt-1">Checks sitemap.xml for privacy URLs</p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Robots.txt</h4>
              <p className="text-xs text-slate-500 mt-1">Searches robots.txt for references</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PrivacyHunter;