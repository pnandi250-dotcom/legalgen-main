'use client';

import { useState } from 'react';
import { AlertCircle, FileText, ChevronDown, ChevronUp, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface MissingPolicy {
  id: string;
  name: string;
  regulation: string;
  description: string;
  severity: 'critical' | 'important' | 'recommended';
  generateType: string;
  minWordCount?: number;
  requiredSections?: string[];
  url?: string;
}

interface MissingPolicyCardProps {
  policy: MissingPolicy;
  onGenerate: (type: string) => void;
  generating?: string | null;
  jurisdiction?: string;
}

export function MissingPolicyCard({ policy, onGenerate, generating, jurisdiction }: MissingPolicyCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const severityConfig = {
    critical: { color: 'bg-red-100 text-red-800 border-red-200', iconColor: 'text-red-600', label: 'Critical' },
    important: { color: 'bg-amber-100 text-amber-800 border-amber-200', iconColor: 'text-amber-600', label: 'Important' },
    recommended: { color: 'bg-blue-100 text-blue-800 border-blue-200', iconColor: 'text-blue-600', label: 'Recommended' },
  };
  
  const config = severityConfig[policy.severity];
  
  return (
    <Card className={`border-l-4 ${config.color} transition-all hover:shadow-md`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{policy.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className={config.color.replace('bg-', 'bg-').replace('text-', 'text-')}>
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {policy.regulation}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={`policy-details-${policy.id}`}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {expanded && (
              <div id={`policy-details-${policy.id}`} className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p className="text-slate-700 dark:text-slate-300">{policy.description}</p>
                {policy.minWordCount && (
                  <p><strong>Min words:</strong> {policy.minWordCount}</p>
                )}
                {policy.requiredSections && policy.requiredSections.length > 0 && (
                  <div>
                    <strong>Required sections:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {policy.requiredSections.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={() => onGenerate(policy.generateType)}
              disabled={generating === policy.generateType}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              size="sm"
            >
              {generating === policy.generateType ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate
                </>
              )}
            </Button>
            
            {policy.url && (
              <a
                href={policy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline text-sm flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Existing
              </a>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

interface MissingPoliciesPanelProps {
  missingPolicies: MissingPolicy[];
  onGenerate: (type: string) => void;
  generating?: string | null;
  jurisdiction?: string;
  scanScore?: number;
}

export function MissingPoliciesPanel({ 
  missingPolicies, 
  onGenerate, 
  generating, 
  jurisdiction,
  scanScore 
}: MissingPoliciesPanelProps) {
  if (missingPolicies.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6 pb-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            All Policies Found!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Great! All required policies for {jurisdiction || 'this jurisdiction'} were detected.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Sort by severity
  const severityOrder = { critical: 0, important: 1, recommended: 2 };
  const sorted = [...missingPolicies].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  const criticalCount = missingPolicies.filter(p => p.severity === 'critical').length;
  const importantCount = missingPolicies.filter(p => p.severity === 'important').length;
  const recommendedCount = missingPolicies.filter(p => p.severity === 'recommended').length;
  
  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="pt-4 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Missing Policies Detected
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {missingPolicies.length} polic{missingPolicies.length === 1 ? 'y' : 'ies'} missing for {jurisdiction || 'compliance'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <span className="relative top-[1px]">●</span>
                  {criticalCount} Critical
                </Badge>
              )}
              {importantCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
                  <span className="relative top-[1px]">●</span>
                  {importantCount} Important
                </Badge>
              )}
              {recommendedCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
                  <span className="relative top-[1px]">●</span>
                  {recommendedCount} Recommended
                </Badge>
              )}
            </div>
          </div>
          
          {scanScore !== undefined && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Compliance Score
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-500"
                      style={{ width: `${scanScore}%` }}
                    />
                  </div>
                  <span className={`font-bold text-lg ${scanScore >= 80 ? 'text-green-600' : scanScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {scanScore}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Missing Policies List */}
      <div className="space-y-3">
        {sorted.map((policy) => (
          <MissingPolicyCard
            key={policy.id}
            policy={policy}
            onGenerate={onGenerate}
            generating={generating}
            jurisdiction={jurisdiction}
          />
        ))}
      </div>
    </div>
  );
}

export function ComplianceResultCard({
  domain,
  url,
  score,
  foundPolicies,
  missingPolicies,
  businessType,
  jurisdiction,
  onGenerate,
  generating,
  onViewPolicy,
}: {
  domain: string;
  url: string;
  score: number;
  foundPolicies: Array<{ name: string; url: string }>;
  missingPolicies: MissingPolicy[];
  businessType: string;
  jurisdiction: string;
  onGenerate: (type: string) => void;
  generating?: string | null;
  onViewPolicy?: (url: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white truncate max-w-xs">
              {domain}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {url}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {businessType}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {jurisdiction}
          </Badge>
        </div>
      </div>
      
      {/* Score */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 pb-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="352"
                  strokeDashoffset={`${352 - (352 * score) / 100}`}
                  className="transition-all duration-1000"
                  style={{ filter: 'dropShadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {score}%
                </span>
              </div>
            </div>
            <p className={`font-semibold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
              {score >= 80 ? 'Compliant' : score >= 50 ? 'Needs Work' : 'Critical Gaps'}
            </p>
            <p className="text-sm text-slate-500 mt-1">Compliance Score</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 pb-8">
            <h4 className="font-medium text-slate-900 dark:text-white mb-4 text-center">Policy Status</h4>
            <div className="space-y-3">
              {[
                { label: 'Found', count: foundPolicies.length, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
                { label: 'Missing', count: missingPolicies.length, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
                { label: 'Critical Missing', count: missingPolicies.filter(p => p.severity === 'critical').length, color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</span>
                  <span className={`font-bold text-lg ${stat.color} px-3 py-1 rounded-full ${stat.bg}`}>
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Found Policies */}
      {foundPolicies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Found Policies ({foundPolicies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {foundPolicies.map((policy) => (
                <div key={policy.name} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-green-800 dark:text-green-200">{policy.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onViewPolicy?.(policy.url)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Missing Policies */}
      <MissingPoliciesPanel
        missingPolicies={missingPolicies}
        onGenerate={onGenerate}
        generating={generating}
        jurisdiction={jurisdiction}
        scanScore={score}
      />
    </div>
  );
}