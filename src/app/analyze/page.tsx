'use client';

/**
 * LegalGen V2 - Full Analysis Page
 *
 * Comprehensive compliance analysis with detailed results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';


export default function AnalyzePage() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [user, router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-6 p-8">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">🔒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Login Required</h2>
                    <p className="text-slate-600 max-w-md">Please login to access this feature</p>
                    <button
                        onClick={signInWithGoogle}
                        className="bg-[#C2410C] hover:bg-[#a3380a] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                        LOGIN with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AnalyzeContent user={user} />
    );
}

function AnalyzeContent({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
    const [step, setStep] = useState<'input' | 'features' | 'results'>('input');
    const [companyName, setCompanyName] = useState('');
    const [website, setWebsite] = useState('');
    const [industry, setIndustry] = useState('');
    const [features, setFeatures] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const featureOptions = [
        { id: 'hasUsers', label: 'Has Users/Customers', category: 'Data' },
        { id: 'hasPayments', label: 'Accepts Payments', category: 'Commerce' },
        { id: 'sellsProducts', label: 'Sells Products', category: 'Commerce' },
        { id: 'hasServices', label: 'Provides Services', category: 'Commerce' },
        { id: 'hasCookies', label: 'Uses Cookies', category: 'Technology' },
        { id: 'hasAds', label: 'Runs Advertisements', category: 'Marketing' },
        { id: 'hasNewsletter', label: 'Email Newsletter', category: 'Marketing' },
        { id: 'hasUserContent', label: 'User-Generated Content', category: 'Content' },
        { id: 'hasSocialFeatures', label: 'Social Features', category: 'Social' },
        { id: 'hasBookingSystem', label: 'Booking System', category: 'Operations' },
        { id: 'hasDigitalProducts', label: 'Digital Products', category: 'Commerce' },
        { id: 'hasAffiliateMarketing', label: 'Affiliate Marketing', category: 'Marketing' },
    ];

    async function runAnalysis() {
        setLoading(true);

        try {
            // On-site scanner API: SSRF-guarded, authenticated, quota-metered.
            const idToken = await user?.getIdToken().catch(() => null);
            const response = await fetch('/api/compliance/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
                },
                body: JSON.stringify({
                    url: website,
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setResults(data.data);
                setStep('results');
            } else {
                alert('Analysis failed: ' + (typeof data.error === 'string' ? data.error : data.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Failed to run analysis');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🔬 Compliance Analysis
                    </h1>
                    <p className="text-gray-600">
                        Get detailed compliance assessment for your business
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    {['Business Info', 'Features', 'Results'].map((label, idx) => (
                        <React.Fragment key={label}>
                            <div className={`flex items-center gap-2 ${(idx === 0 && step === 'input') ||
                                (idx === 1 && step === 'features') ||
                                (idx === 2 && step === 'results')
                                ? 'text-blue-600'
                                : idx < ['input', 'features', 'results'].indexOf(step)
                                    ? 'text-green-600'
                                    : 'text-gray-400'
                                }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${(idx === 0 && step === 'input') ||
                                    (idx === 1 && step === 'features') ||
                                    (idx === 2 && step === 'results')
                                    ? 'bg-blue-600 text-white'
                                    : idx < ['input', 'features', 'results'].indexOf(step)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200'
                                    }`}>
                                    {idx < ['input', 'features', 'results'].indexOf(step) ? '✓' : idx + 1}
                                </div>
                                <span className="hidden sm:inline font-medium">{label}</span>
                            </div>
                            {idx < 2 && <div className="flex-1 h-px bg-gray-300" />}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step 1: Basic Info */}
                {step === 'input' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Company Name *</label>
                                <Input
                                    placeholder="e.g., Acme Corp"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Website URL</label>
                                <Input
                                    placeholder="https://example.com"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Industry</label>
                                <Input
                                    placeholder="e.g., E-commerce, SaaS, Healthcare"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={() => setStep('features')}
                                    disabled={!companyName}
                                >
                                    Next: Select Features →
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Features */}
                {step === 'features' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>What does your business do?</CardTitle>
                            <p className="text-sm text-gray-600">
                                Select all that apply. This helps us determine which regulations apply.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                {featureOptions.map((option) => (
                                    <label
                                        key={option.id}
                                        className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={features[option.id] || false}
                                            onChange={(e) => setFeatures({
                                                ...features,
                                                [option.id]: e.target.checked
                                            })}
                                            className="mt-1"
                                        />
                                        <div>
                                            <span className="font-medium">{option.label}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                                {option.category}
                                            </Badge>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-between pt-4 border-t">
                                <Button variant="outline" onClick={() => setStep('input')}>
                                    ← Back
                                </Button>
                                <Button onClick={runAnalysis} disabled={loading}>
                                    {loading ? 'Analyzing...' : 'Run Analysis →'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Results */}
                {step === 'results' && results && (
                    <div className="space-y-6">
                        {/* Executive Summary */}
                        <Card className="border-2 border-blue-200">
                            <CardHeader>
                                <CardTitle className="text-xl">📊 Executive Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold mb-4">
                                    {results.executiveSummary?.headline}
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {results.executiveSummary?.keyPoints?.map((point: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span className="text-sm">{point}</span>
                                        </div>
                                    ))}
                                </div>

                                {results.executiveSummary?.attentionRequired && (
                                    <Alert variant="destructive" className="mt-4">
                                        ⚠️ Immediate attention required!
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Risk Score */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <div className={`text-6xl font-bold ${results.risk?.level === 'critical' ? 'text-red-600' :
                                        results.risk?.level === 'high' ? 'text-orange-600' :
                                            results.risk?.level === 'medium' ? 'text-yellow-600' :
                                                'text-green-600'
                                        }`}>
                                        {results.risk?.overallScore || 0}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Overall Risk Score</p>
                                        <Badge variant="outline" className="text-lg px-4 py-1 uppercase">
                                            {results.risk?.level || 'Unknown'}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Category Breakdown */}
                                {results.risk?.categories?.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <h4 className="font-semibold">Risk by Category</h4>
                                        {results.risk.categories.map((cat: any, idx: number) => (
                                            <div key={idx}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{cat.category.replace('_', ' ')}</span>
                                                    <span>{cat.score}/100</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${cat.score > 60 ? 'bg-red-500' :
                                                            cat.score > 30 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${cat.score}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Risks */}
                        {results.risk?.topRisks?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>⚠️ Top Risk Areas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {results.risk.topRisks.slice(0, 5).map((risk: any, idx: number) => (
                                            <div key={idx} className="p-4 border rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-semibold">{risk.obligation?.title}</h4>
                                                    <Badge variant={
                                                        risk.residualRisk > 60 ? 'destructive' :
                                                            risk.residualRisk > 30 ? 'default' : 'secondary'
                                                    }>
                                                        {risk.residualRisk}/100
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><strong>Status:</strong> {risk.applicability}</p>
                                                    <p><strong>Inherent Risk:</strong> {risk.inherentRisk}/100</p>

                                                    {risk.gaps?.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="font-medium text-red-600">Gaps:</p>
                                                            <ul className="list-disc list-inside ml-2">
                                                                {risk.gaps.map((gap: string, gIdx: number) => (
                                                                    <li key={gIdx}>{gap}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recommendations */}
                        {results.recommendations?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>💡 Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {results.recommendations.map((rec: any, idx: number) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Badge variant={
                                                    rec.priority === 'immediate' ? 'destructive' :
                                                        rec.priority === 'short-term' ? 'default' : 'secondary'
                                                }>
                                                    {rec.priority}
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="font-medium">{rec.area}</p>
                                                    <p className="text-sm text-gray-600">{rec.action}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Effort: {rec.effort} • Reduces risk by ~{rec.reducesRiskBy}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Investment Estimate */}
                        {results.investmentEstimate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>💰 Estimated Investment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {results.investmentEstimate.estimatedHours}h
                                            </p>
                                            <p className="text-sm text-gray-600">Estimated Hours</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{(results.investmentEstimate.estimatedCostRange.min * 80).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600">Min Cost (INR)</p>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <p className="text-2xl font-bold text-orange-600">
                                                ₹{(results.investmentEstimate.estimatedCostRange.max * 80).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600">Max Cost (INR)</p>
                                        </div>
                                    </div>

                                    {results.investmentEstimate.phases?.map((phase: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="font-medium">{phase.name}</span>
                                            <div className="text-right">
                                                <span className="text-sm">{phase.hours} hours</span>
                                                <span className="mx-2">•</span>
                                                <span className="text-sm text-gray-600">
                                                    ~{phase.riskReduction}% risk reduction
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-center">
                            <Button onClick={() => setStep('input')}>
                                ← New Analysis
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                                View Dashboard
                            </Button>
                            <Button variant="outline">
                                Export Report (PDF)
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}