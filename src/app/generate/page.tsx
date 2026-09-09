"use client";
import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { saveDocumentToDb } from "@/lib/firebase/firestore";
import { trackGeneration } from "@/lib/firebase/analytics";
import { useAuth } from "@/lib/firebase/AuthContext";
import { Shield, FileText, RefreshCcw, Cookie, ArrowRight, ArrowLeft, Copy, Check, Download, CheckCircle2, Loader2, ChevronRight, Sparkles, Scale, Truck, AlertTriangle, Clock, Code, Ban, ShieldCheck, FileBadge, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { DocumentType, FormData, QuestionGroup, GeneratedDocument } from "@/lib/legalgen/types";
import { getQuestions } from "@/lib/legalgen/questions";
import { generatePrivacyPolicy } from "@/lib/legalgen/privacy-policy";
import { generateTermsOfService } from "@/lib/legalgen/terms-of-service";
import { generateRefundPolicy } from "@/lib/legalgen/refund-policy";
import { generateCookiePolicy } from "@/lib/legalgen/cookie-policy";
import { generateDisclaimer } from "@/lib/legalgen/disclaimer";
import { generateShippingPolicy } from "@/lib/legalgen/shipping-policy";
import { generateCancellationPolicy } from "@/lib/legalgen/cancellation-policy";
import { generateReturnPolicy } from "@/lib/legalgen/return-policy";
import { generateServiceLevelAgreement } from "@/lib/legalgen/service-level-agreement";
import { generateCommunityGuidelines } from "@/lib/legalgen/community-guidelines";
import { generateGDPRCompliance } from "@/lib/legalgen/gdpr-compliance";
import { generateDataProcessingAgreement } from "@/lib/legalgen/data-processing-agreement";
import { generateDmcaPolicy } from "@/lib/legalgen/dmca-policy";
import { generateContentModerationPolicy } from "@/lib/legalgen/content-moderation-policy";
import { generateEula } from "@/lib/legalgen/eula";
import { generateAup } from "@/lib/legalgen/aup";



const DOC_CONFIGS = [
    { type: "privacy-policy" as DocumentType, title: "Privacy Policy", description: "IT Act 2000 & DPDP Act 2023.", icon: <Shield className="w-6 h-6" />, color: "text-emerald-700", bgColor: "bg-emerald-50", badge: "Popular", category: "Core" },
    { type: "terms-of-service" as DocumentType, title: "Terms of Service", description: "User accounts, IP rights.", icon: <FileText className="w-6 h-6" />, color: "text-slate-700", bgColor: "bg-slate-50", badge: "Essential", category: "Core" },
    { type: "refund-policy" as DocumentType, title: "Refund Policy", description: "Consumer Protection Act 2019.", icon: <RefreshCcw className="w-6 h-6" />, color: "text-orange-700", bgColor: "bg-orange-50", badge: "Required", category: "E-commerce" },
    { type: "cookie-policy" as DocumentType, title: "Cookie Policy", description: "Cookie usage disclosure.", icon: <Cookie className="w-6 h-6" />, color: "text-amber-700", bgColor: "bg-amber-50", badge: "Standard", category: "Website" },
    { type: "shipping-policy" as DocumentType, title: "Shipping Policy", description: "Delivery timelines.", icon: <Truck className="w-6 h-6" />, color: "text-blue-700", bgColor: "bg-blue-50", badge: "E-commerce", category: "E-commerce" },
    { type: "cancellation-policy" as DocumentType, title: "Cancellation Policy", description: "Booking cancellations.", icon: <AlertTriangle className="w-6 h-6" />, color: "text-red-700", bgColor: "bg-red-50", badge: "Services", category: "Services" },
    { type: "return-policy" as DocumentType, title: "Return Policy", description: "Return procedures.", icon: <Truck className="w-6 h-6" />, color: "teal-700", bgColor: "bg-teal-50", badge: "Retail", category: "E-commerce" },
    { type: "disclaimer" as DocumentType, title: "Disclaimer", description: "Limit liability.", icon: <Scale className="w-6 h-6" />, color: "text-purple-700", bgColor: "bg-purple-50", badge: "Protection", category: "Website" },
    { type: "service-level-agreement" as DocumentType, title: "SLA", description: "Uptime guarantees.", icon: <Clock className="w-6 h-6" />, color: "indigo-700", bgColor: "bg-indigo-50", badge: "SaaS", category: "SaaS" },
    { type: "end-user-license-agreement" as DocumentType, title: "EULA", description: "Software license.", icon: <Code className="w-6 h-6" />, color: "cyan-700", bgColor: "bg-cyan-50", badge: "Software", category: "SaaS" },
    { type: "acceptable-use-policy" as DocumentType, title: "AUP", description: "Platform rules.", icon: <Ban className="w-6 h-6" />, color: "rose-700", bgColor: "bg-rose-50", badge: "Platform", category: "Platform" },
    { type: "community-guidelines" as DocumentType, title: "Guidelines", description: "Behavior standards.", icon: <ShieldCheck className="w-6 h-6" />, color: "pink-700", bgColor: "bg-pink-50", badge: "Social", category: "Platform" },
    { type: "dmca-policy" as DocumentType, title: "DMCA Policy", description: "Copyright notices.", icon: <FileBadge className="w-6 h-6" />, color: "violet-700", bgColor: "bg-violet-50", badge: "Copyright", category: "Platform" },
    { type: "content-moderation-policy" as DocumentType, title: "Moderation", description: "Moderation rules.", icon: <ShieldCheck className="w-6 h-6" />, color: "fuchsia-700", bgColor: "bg-fuchsia-50", badge: "UGC", category: "Platform" },
    { type: "gdpr-compliance" as DocumentType, title: "GDPR", description: "EU data protection.", icon: <Scale className="w-6 h-6" />, color: "lime-700", bgColor: "bg-lime-50", badge: "EU Users", category: "Data" },
    { type: "data-processing-agreement" as DocumentType, title: "DPA", description: "B2B data terms.", icon: <Handshake className="w-6 h-6" />, color: "emerald-700", bgColor: "bg-emerald-50", badge: "B2B", category: "Data" },
];

// ✅ FIXED: Type generators correctly
const GENERATORS: Record<DocumentType, (data: FormData) => GeneratedDocument> = {
    "privacy-policy": generatePrivacyPolicy,
    "terms-of-service": generateTermsOfService,
    "refund-policy": generateRefundPolicy,
    "cancellation-policy": generateCancellationPolicy,
    "return-policy": generateReturnPolicy,
    "cookie-policy": generateCookiePolicy,
    "shipping-policy": generateShippingPolicy,
    "disclaimer": generateDisclaimer,
    "service-level-agreement": generateServiceLevelAgreement,
    "end-user-license-agreement": generateEula,
    "acceptable-use-policy": generateAup,
    "community-guidelines": generateCommunityGuidelines,
    "dmca-policy": generateDmcaPolicy,
    "content-moderation-policy": generateContentModerationPolicy,
    "gdpr-compliance": generateGDPRCompliance,
    "data-processing-agreement": generateDataProcessingAgreement,
};

type Step = 'select' | 'questions' | 'result';

function GeneratePageContent() {
    const searchParams = useSearchParams();
    const { user, signInWithGoogle } = useAuth();
    const [step, setStep] = useState<Step>('select');
    const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
    const [formData, setFormData] = useState<FormData>({});
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null); // ✅ FIXED: Use GeneratedDocument type
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        const type = searchParams.get('type') as DocumentType;
        if (type && DOC_CONFIGS.find(d => d.type === type)) handleSelectDoc(type);
    }, [searchParams]);

    const questions: QuestionGroup[] = selectedDoc ? getQuestions(selectedDoc) : [];
    const allQuestions = questions.flatMap(g => g.questions);
    const currentQuestion = allQuestions[currentQuestionIndex];
    const progress = allQuestions.length > 0 ? ((currentQuestionIndex + 1) / allQuestions.length) * 100 : 0;
    const filteredDocs = activeCategory === 'All' ? DOC_CONFIGS : DOC_CONFIGS.filter(d => d.category === activeCategory);
    const categories = ['All', ...new Set(DOC_CONFIGS.map(d => d.category))];
    // Get HTML for display
    const generatedHtml = generatedDoc?.html || '';

    const handleSelectDoc = useCallback((docType: DocumentType) => {
        if (!user) { signInWithGoogle(); return; }
        setSelectedDoc(docType); setStep('questions'); setCurrentQuestionIndex(0); setFormData({}); setGeneratedDoc(null);
    }, [user, signInWithGoogle]);

    const handleAnswer = useCallback((questionId: string, value: string | boolean | string[]) => {
        setFormData(prev => ({ ...prev, [questionId]: value }));
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!selectedDoc || !user) return;
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        try {
            const generator = GENERATORS[selectedDoc];
            const result = generator(formData); // Returns GeneratedDocument
            setGeneratedDoc(result); setStep('result');

            // ✅ FIXED: Use correct function signatures
            try {
                await saveDocumentToDb(user.uid, result.title, result.html);
                await trackGeneration({ docType: selectedDoc, docTitle: result.title, userId: user.uid, userEmail: user.email });
            } catch { }
        } finally { setIsGenerating(false); }
    }, [selectedDoc, formData, user]);

    return (
        <div className="min-h-screen bg-[#F3EFE7] dark:bg-slate-950 pt-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link href="/" className="inline-flex items-center text-sm text-slate-500 mb-4">← Back to Home</Link>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3"><Sparkles className="w-8 h-8 text-[#C2410C]" />Document Generator</h1>
                <p className="text-slate-600 mb-8">Generate professional legal documents in 60 seconds</p>

                {step === 'select' && (
                    <div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm ${activeCategory === cat ? 'bg-[#C2410C] text-white' : 'bg-white dark:bg-slate-800 border'}`}>{cat}</button>
                            ))}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {filteredDocs.map(doc => (
                                <Card key={doc.type} onClick={() => handleSelectDoc(doc.type)} className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3"><div className={`w-12 h-12 rounded-xl ${doc.bgColor} ${doc.color} flex items-center justify-center`}>{doc.icon}</div><Badge>{doc.badge}</Badge></div>
                                        <h3 className="font-semibold text-lg">{doc.title}</h3><p className="text-sm text-slate-600 mt-1">{doc.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'questions' && (
                    <div>
                        <Card className="mb-4"><CardContent className="p-4"><div className="flex justify-between mb-2"><span>{DOC_CONFIGS.find(d => d.type === selectedDoc)?.title}</span><span>{currentQuestionIndex + 1} / {allQuestions.length}</span></div><Progress value={progress} /></CardContent></Card>
                        <Card><CardHeader><CardTitle>{currentQuestion?.label}</CardTitle></CardHeader><CardContent className="space-y-4">
                            {/* ✅ FIXED: Handle question types properly */}
                            {(currentQuestion?.type === 'text' || currentQuestion?.type === 'email' || currentQuestion?.type === 'url') && (
                                <Input value={(formData[currentQuestion!.id] as string) || ''} onChange={e => handleAnswer(currentQuestion!.id, e.target.value)} placeholder={currentQuestion.placeholder} />
                            )}
                            {currentQuestion?.type === 'textarea' && (
                                <Textarea value={(formData[currentQuestion!.id] as string) || ''} onChange={e => handleAnswer(currentQuestion!.id, e.target.value)} rows={4} />
                            )}
                            {currentQuestion?.type === 'select' && (
                                <Select value={(formData[currentQuestion!.id] as string) || ''} onValueChange={v => handleAnswer(currentQuestion!.id, v)}>
                                    <SelectTrigger><SelectValue placeholder={`Select ${currentQuestion.label.toLowerCase()}...`} /></SelectTrigger>
                                    <SelectContent>
                                        {/* ✅ FIXED: SelectItem uses string children */}
                                        {currentQuestion.options?.map(o => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {currentQuestion?.type === 'multiselect' && (
                                <div className="space-y-2">
                                    {currentQuestion.options?.map(opt => (
                                        <label key={opt.value} className={`flex items-center p-3 rounded-lg border cursor-pointer ${(formData[currentQuestion!.id] as string[])?.includes(opt.value) ? 'border-[#C2410C] bg-[#C2410C]/5' : ''}`}>
                                            <input type="checkbox" checked={(formData[currentQuestion!.id] as string[])?.includes(opt.value) || false} onChange={e => {
                                                const current = (formData[currentQuestion!.id] as string[]) || [];
                                                handleAnswer(currentQuestion!.id, e.target.checked ? [...current, opt.value] : current.filter(v => v !== opt.value));
                                            }} className="mr-3" />
                                            <span>{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {/* ✅ FIXED: Removed boolean type - use checkbox instead */}
                            {currentQuestion?.type === 'checkbox' && (
                                <label className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer">
                                    <input type="checkbox" checked={!!formData[currentQuestion!.id]} onChange={e => handleAnswer(currentQuestion!.id, e.target.checked)} className="mr-3" />
                                    <span>Yes, this applies to my business</span>
                                </label>
                            )}
                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => currentQuestionIndex > 0 ? setCurrentQuestionIndex(i => i - 1) : setStep('select')}>← Back</Button>
                                <Button onClick={() => currentQuestionIndex < allQuestions.length - 1 ? setCurrentQuestionIndex(i => i + 1) : handleGenerate()} disabled={!formData[currentQuestion?.id]} className="bg-[#C2410C]">
                                    {isGenerating ? <><Loader2 className="animate-spin mr-2" />Generating...</> : currentQuestionIndex < allQuestions.length - 1 ? 'Next →' : <><Sparkles className="mr-2" />Generate</>}
                                </Button>
                            </div>
                        </CardContent></Card>
                    </div>
                )}

                {step === 'result' && (
                    <div>
                        <Alert className="mb-4 border-emerald-200 bg-emerald-50"><CheckCircle2 className="h-4 text-emerald-600" /><AlertDescription className="text-emerald-700">Document generated successfully!</AlertDescription></Alert>
                        <div className="flex gap-3 mb-4">
                            <Button onClick={async () => { await navigator.clipboard.writeText(generatedHtml); setCopied(true); setTimeout(() => setCopied(false), 2000); }} variant="outline">{copied ? '✓ Copied!' : 'Copy'}</Button>
                            <Button onClick={() => { const b = new Blob([generatedHtml], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${selectedDoc}.html`; a.click(); }} variant="outline">Download</Button>
                            <Button onClick={() => { setStep('select'); setSelectedDoc(null); }} className="bg-[#C2410C]">Generate Another</Button>
                        </div>
                        <Card><CardHeader><CardTitle>Preview - {generatedDoc?.title}</CardTitle></CardHeader><CardContent><div className="bg-slate-50 p-6 max-h-[600px] overflow-auto prose" dangerouslySetInnerHTML={{ __html: generatedHtml }} /></CardContent></Card>
                    </div>
                )}
            </div>
        </div>
    );
}

// Fix for Vercel deployment
export default function GeneratePage() {
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
        <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#C2410C]" /></div>}>
            <GeneratePageContent />
        </Suspense>
    );
}