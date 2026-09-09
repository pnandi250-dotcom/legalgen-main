"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, RefreshCcw, Cookie, ArrowRight, CheckCircle2, Sparkles, Search, ChevronRight, Star, Zap, Globe, Lock, ShieldCheck, TrendingUp, Truck, Scale } from 'lucide-react';
import { useAuth } from '@/lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';

const documentTypes = [
    { type: "privacy-policy", title: "Privacy Policy", description: "IT Act 2000 & DPDP Act 2023 compliant.", icon: <Shield className="w-7 h-7" />, color: "text-emerald-600", bgColor: "bg-emerald-50", badge: "Popular" },
    { type: "terms-of-service", title: "Terms of Service", description: "User accounts, IP rights, liability limits.", icon: <FileText className="w-7 h-7" />, color: "text-slate-700", bgColor: "bg-slate-50", badge: "Essential" },
    { type: "refund-policy", title: "Refund Policy", description: "Consumer Protection Act 2019 compliant.", icon: <RefreshCcw className="w-7 h-7" />, color: "text-orange-600", bgColor: "bg-orange-50", badge: "Required" },
    { type: "cookie-policy", title: "Cookie Policy", description: "Cookie usage and tracking disclosure.", icon: <Cookie className="w-7 h-7" />, color: "text-amber-600", bgColor: "bg-amber-50", badge: "Standard" },
    { type: "shipping-policy", title: "Shipping Policy", description: "Delivery timelines and procedures.", icon: <Truck className="w-7 h-7" />, color: "text-blue-600", bgColor: "bg-blue-50", badge: "E-commerce" },
    { type: "disclaimer", title: "Disclaimer", description: "Limit liability for content.", icon: <Scale className="w-7 h-7" />, color: "text-purple-600", bgColor: "bg-purple-50", badge: "Protection" },
];

const features = [
    { icon: <Zap className="w-6 h-6" />, title: "60-Second Generation", description: "Get professional legal documents instantly." },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "India Compliant", description: "IT Act, DPDP Act, Consumer Protection Act." },
    { icon: <Globe className="w-6 h-6" />, title: "Website Audit", description: "Scan any site for missing legal pages." },
    { icon: <Lock className="w-6 h-6" />, title: "Secure & Private", description: "Your data is encrypted and protected." },
];

export default function LandingPage() {
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
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-[#F3EFE7]">
            {/* Hero */}
            <section className="py-20 px-4 text-center">
                <Badge className="mb-4 bg-[#C2410C]/10 text-[#C2410C]">V2 Platform</Badge>
                <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 dark:text-white mb-6">
                    Generate Legal Documents<br /><span className="text-[#C2410C]">In 60 Seconds</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
                    Privacy Policy, Terms of Service, Refund Policy & more — 100% compliant with Indian laws.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/generate"><Button size="lg" className="bg-[#C2410C] px-8 py-6 text-lg min-h-[56px]"><FileText className="w-5 h-5 mr-2" />Generate Documents<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
                    <Link href="/compliance"><Button size="lg" variant="outline" className="px-8 py-6 text-lg min-h-[56px] border-2"><Search className="w-5 h-5 mr-2" />Check Compliance</Button></Link>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 bg-white dark:bg-slate-900 border-y">
                <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center">
                    <div><div className="text-3xl font-bold text-[#C2410C]">50K+</div><div className="text-sm text-slate-500">Documents Generated</div></div>
                    <div><div className="text-3xl font-bold text-[#C2410C]">16+</div><div className="text-sm text-slate-500">Document Types</div></div>
                    <div><div className="text-3xl font-bold text-[#C2410C]">100%</div><div className="text-sm text-slate-500">Free Forever</div></div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">Why FOOTER?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <Card key={i} className="scroll-reveal border-slate-200"><CardContent className="p-6 text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center">{f.icon}</div>
                                <h3 className="font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm text-slate-600">{f.description}</p>
                            </CardContent></Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Document Types */}
            <section className="py-16 px-4 bg-white dark:bg-slate-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-white">Popular Documents</h2>
                    <p className="text-center text-slate-600 mb-10">Choose a document type to generate</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documentTypes.map((doc) => (
                            <Link key={doc.type} href={`/generate?type=${doc.type}`}>
                                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full scroll-reveal">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={`w-12 h-12 rounded-xl ${doc.bgColor} ${doc.color} flex items-center justify-center`}>{doc.icon}</div>
                                            <Badge>{doc.badge}</Badge>
                                        </div>
                                        <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                                        <p className="text-sm text-slate-600">{doc.description}</p>
                                        <div className="mt-4 text-sm text-[#C2410C] opacity-0 group-hover:opacity-100">Generate →</div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-10">
                        <Link href="/generate"><Button size="lg" variant="outline" className="border-2 border-[#C2410C] text-[#C2410C] px-8">View All Documents<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
                    </div>
                </div>
            </section>

            {/* Compliance CTA */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <Card className="overflow-hidden"><div className="grid md:grid-cols-2">
                        <div className="p-8 bg-gradient-to-br from-[#C2410C] to-orange-600 text-white">
                            <Badge className="bg-white/20 text-white mb-4">V2 Feature</Badge>
                            <h2 className="text-3xl font-bold mb-4">Website Compliance Scanner</h2>
                            <p className="mb-6">Scan any website for missing legal pages and get instant compliance score.</p>
                            <ul className="space-y-2 mb-6">
                                {['Detects 12+ business types', 'Scans 16 legal requirements', 'DPDP & IT Act checks'].map((item, i) => (<li key={i} className="flex items-center space-x-2"><CheckCircle2 className="w-5 h-5" /><span>{item}</span></li>))}
                            </ul>
                            <Link href="/compliance"><Button size="lg" className="bg-white text-[#C2410C] px-8"><Search className="w-5 h-5 mr-2" />Scan Website</Button></Link>
                        </div>
                        <div className="p-8 bg-slate-50 flex items-center justify-center">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between mb-2"><span>Compliance Score</span><span className="font-bold text-[#C2410C]">72%</span></div><div className="h-2 bg-gray-200 rounded"><div className="h-full w-[72%] bg-[#C2410C] rounded"></div></div></div>
                                {[{ l: 'Privacy Policy', s: 'missing' }, { l: 'Terms of Service', s: 'found' }, { l: 'Cookie Policy', s: 'missing' }, { l: 'Refund Policy', s: 'found' }].map((item, i) => (
                                    <div key={i} className="flex justify-between bg-white p-3 rounded-lg"><span>{item.l}</span><span className={`text-xs px-2 py-1 rounded ${item.s === 'found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.s === 'found' ? '✓ Found' : '✗ Missing'}</span></div>
                                ))}
                            </div>
                        </div>
                    </div></Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-slate-900 text-slate-400">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                    <div><div className="flex items-center space-x-2 mb-4"><div className="w-8 h-8 bg-[#C2410C] rounded-lg flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div><span className="text-white font-bold">FOOTER</span></div><p className="text-sm">Generate India-compliant legal documents in seconds.</p></div>
                    <div><h4 className="font-semibold text-white mb-4">Quick Links</h4><ul className="space-y-2 text-sm"><li><Link href="/" className="hover:text-white">Home</Link></li><li><Link href="/generate" className="hover:text-white">Generate</Link></li><li><Link href="/compliance" className="hover:text-white">Compliance</Link></li></ul></div>
                    <div><h4 className="font-semibold text-white mb-4">Legal</h4><ul className="space-y-2 text-sm"><li><Link href="/generate?type=privacy-policy" className="hover:text-white">Privacy Policy</Link></li><li><Link href="/generate?type=terms-of-service" className="hover:text-white">Terms of Service</Link></li><li><Link href="/generate?type=refund-policy" className="hover:text-white">Refund Policy</Link></li></ul></div>
                </div>
                <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800 text-sm text-center"><p>© 2024 FOOTER. Not legal advice.</p></div>
            </footer>

            <style jsx global>{`.scroll-reveal{opacity:0;transform:translateY(20px);transition:all 0.6s}.scroll-reveal.visible{opacity:1;transform:translateY(0)}`}</style>
        </div>
    );
}