"use client";
import React, { useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { trackAudit } from "@/lib/firebase/analytics";
import { Shield, Search, Globe, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ComplianceResult {
    page: string; found: boolean; url: string | null; source: string;
    severity: 'critical' | 'important'; description: string; generateType: string;
}

const COMPLIANCE_KEYWORDS = {
    'privacy-policy': { label: 'Privacy Policy', keywords: ['privacy policy', 'data protection'], description: 'Mandatory under DPDP Act 2023' },
    'terms-of-service': { label: 'Terms of Service', keywords: ['terms of service', 'terms and conditions'], description: 'Required to limit liability' },
    'refund-policy': { label: 'Refund Policy', keywords: ['refund policy'], description: 'Consumer Protection Act 2019' },
    'cancellation-policy': { label: 'Cancellation Policy', keywords: ['cancellation policy'], description: 'For bookings & subscriptions' },
    'return-policy': { label: 'Return Policy', keywords: ['return policy'], description: 'For physical goods retailers' },
    'cookie-policy': { label: 'Cookie Policy', keywords: ['cookie policy'], description: 'Tracking transparency' },
    'shipping-policy': { label: 'Shipping Policy', keywords: ['shipping policy'], description: 'For e-commerce sites' },
    'disclaimer': { label: 'Disclaimer', keywords: ['disclaimer'], description: 'Limit content liability' },
    'service-level-agreement': { label: 'SLA', keywords: ['service level agreement'], description: 'For SaaS providers' },
    'end-user-license-agreement': { label: 'EULA', keywords: ['eula', 'license'], description: 'For software products' },
    'acceptable-use-policy': { label: 'AUP', keywords: ['acceptable use'], description: 'Platform rules' },
    'community-guidelines': { label: 'Community Guidelines', keywords: ['community guidelines'], description: 'User interaction rules' },
    'dmca-policy': { label: 'DMCA Policy', keywords: ['dmca', 'copyright'], description: 'Copyright infringement' },
    'content-moderation-policy': { label: 'Content Moderation', keywords: ['content moderation'], description: 'IT Rules 2021' },
    'gdpr-compliance': { label: 'GDPR Compliance', keywords: ['gdpr'], description: 'For EU users' },
};

function buildChecks(text: string): ComplianceResult[] {
    return Object.entries(COMPLIANCE_KEYWORDS).map(([type, entry]) => ({
        page: entry.label,
        found: entry.keywords.some(kw => text.toLowerCase().includes(kw)),
        url: null,
        source: '',
        severity: ['privacy-policy', 'terms-of-service', 'cookie-policy'].includes(type) ? 'critical' : 'important',
        description: entry.description,
        generateType: type,
    }));
}

function calcScore(results: ComplianceResult[]): number {
    if (!results.length) return 0;
    const score = results.reduce((acc, r) => acc + (r.found ? (r.severity === 'critical' ? 30 : 15) : 0), 0);
    const max = results.reduce((acc, r) => acc + (r.severity === 'critical' ? 30 : 15), 0);
    return Math.round((score / max) * 100);
}

export default function CompliancePage() {
    const { user, signInWithGoogle } = useAuth();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCheck = useCallback(async () => {
        if (!user) { signInWithGoogle(); return; }
        let urlToCheck = url.trim();
        if (!urlToCheck) { setError('Please enter a URL'); return; }
        if (!urlToCheck.startsWith('http')) urlToCheck = 'https://' + urlToCheck;
        try { new URL(urlToCheck); } catch { setError('Invalid URL'); return; }

        setIsLoading(true); setError(null);
        try {
            const res = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: urlToCheck }) });
            const data = await res.json();
            const text = data.content || data.text || '';
            const results = buildChecks(text);
            const score = calcScore(results);
            setResult({ domain: data.domain || new URL(urlToCheck).hostname, url: urlToCheck, score, results, businessType: data.businessType || 'General' });

            // ✅ FIXED: Pass object to trackAudit
            try { await trackAudit({ url: urlToCheck, score, userId: user.uid }); } catch { }
        } catch { setError('Failed to analyze website'); }
        finally { setIsLoading(false); }
    }, [url, user, signInWithGoogle]);

    return (
        <div className="min-h-screen bg-[#F3EFE7] dark:bg-slate-950 pt-20">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-sm text-slate-500 mb-4">← Back to Home</Link>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Search className="w-8 h-8 text-blue-600" />Compliance Scanner</h1>
                <p className="text-slate-600 mb-8">Scan any website for missing legal pages</p>

                <Card className="mb-6"><CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative"><Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <Input value={url} onChange={e => setUrl(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCheck()} placeholder="Enter website URL (e.g., amazon.in)" className="pl-12 min-h-[52px]" disabled={isLoading} />
                        </div>
                        <Button onClick={handleCheck} disabled={isLoading} className="bg-blue-600 min-h-[52px] px-8">{isLoading ? <><Loader2 className="animate-spin mr-2" />Scanning...</> : <><Search className="mr-2" />Scan Website</>}</Button>
                    </div>
                    {error && <Alert className="mt-4 border-red-200 bg-red-50"><AlertCircle className="h-4 text-red-600" /><AlertDescription className="text-red-700">{error}</AlertDescription></Alert>}
                </CardContent></Card>

                {isLoading && (<Card><CardContent className="p-12 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" /><h3>Analyzing Website...</h3></CardContent></Card>)}

                {result && !isLoading && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className={cn("border-2", result.score >= 80 ? "border-emerald-200" : result.score >= 50 ? "border-amber-200" : "border-red-200")}>
                                <CardContent className="p-6"><div className="flex items-center space-x-4">
                                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold", result.score >= 80 ? "bg-emerald-100 text-emerald-600" : result.score >= 50 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600")}>{result.score}%</div>
                                    <div><h3 className="font-semibold text-lg">Compliance Score</h3><p className="text-sm text-slate-500">{result.score >= 80 ? 'Good' : result.score >= 50 ? 'Needs Work' : 'Critical Issues'}</p></div>
                                </div><Progress value={result.score} className="mt-4 h-3" /></CardContent>
                            </Card>
                            <Card><CardContent className="p-6"><div className="flex items-center space-x-4"><div className="w-16 h-16 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><Shield className="w-8 h-8" /></div><div><p className="text-xs text-slate-500">DETECTED TYPE</p><h3 className="font-semibold text-lg">{result.businessType}</h3></div></div></CardContent></Card>
                        </div>

                        <Card><CardHeader><CardTitle>Legal Document Checklist</CardTitle></CardHeader><CardContent className="space-y-3">
                            {result.results.map((item: ComplianceResult, i: number) => (
                                <div key={i} className={cn("flex items-center justify-between p-4 rounded-lg border", item.found ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200")}>
                                    <div className="flex items-center space-x-4"><div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.found ? "bg-emerald-100" : "bg-red-100")}>{item.found ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}</div><div><p className={cn("font-medium", item.found ? "text-emerald-700" : "")}>{item.page}</p><p className="text-xs text-slate-500">{item.description}</p></div></div>
                                    <div className="flex items-center gap-3"><Badge variant="outline" className={cn(item.severity === 'critical' ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600")}>{item.severity}</Badge>{!item.found && <Link href={`/generate?type=${item.generateType}`}><Button size="sm" className="bg-[#C2410C]">Generate<ChevronRight className="w-4 h-4 ml-1" /></Button></Link>}</div>
                                </div>
                            ))}
                        </CardContent></Card>

                        <Card className="bg-gradient-to-r from-[#C2410C] to-orange-600 border-0 text-white"><CardContent className="p-6"><div className="flex flex-col sm:flex-row items-center justify-between gap-4"><div><h3 className="text-xl font-semibold mb-2">Need missing documents?</h3><p>Use our Document Generator to create them in 60 seconds.</p></div><Link href="/generate"><Button size="lg" className="bg-white text-[#C2410C]"><Sparkles className="mr-2" />Generate Documents</Button></Link></div></CardContent></Card>

                        <div className="text-center"><Button variant="outline" onClick={() => { setResult(null); setUrl(''); }}><Search className="mr-2" />Scan Another</Button></div>
                    </div>
                )}
            </div>
        </div>
    );
}