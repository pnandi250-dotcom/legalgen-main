"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/AuthContext";
import { ArrowLeft, FileText, TrendingUp, Calendar, Clock, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/navigation';

interface GenRecord {
    docType: string;
    docTitle: string;
    userId: string | null;
    userEmail: string | null;
    createdAt: Timestamp;
}

export default function AnalyticsPage() {
    // ✅ FIXED: Declare user and signInWithGoogle AT THE TOP (before using them)
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();

    // ✅ Login check - now works because user is declared above
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

    // ✅ FIXED: Removed duplicate declaration - user is already declared at top
    const [total, setTotal] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [byDoc, setByDoc] = useState<Record<string, number>>({});
    const [recent, setRecent] = useState<GenRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Return early if no user
        if (!user) return;

        const db = getFirestore(app);
        const currentUserId = user.uid; // Store in local variable

        async function load() {
            try {
                // Use local variable instead of user.uid directly
                const q = query(collection(db, "generations"), where("userId", "==", currentUserId));
                const snap = await getDocs(q);
                const all: GenRecord[] = snap.docs.map(d => d.data() as GenRecord);

                setTotal(all.length);

                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const today = all.filter(r => {
                    const date = r.createdAt?.toDate ? r.createdAt.toDate() : null;
                    return date && date >= todayStart;
                });
                setTodayCount(today.length);

                const counts: Record<string, number> = {};
                all.forEach(r => { counts[r.docTitle] = (counts[r.docTitle] || 0) + 1; });
                setByDoc(counts);

                const sorted = all.sort((a, b) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
                setRecent(sorted.slice(0, 20));

            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#F3EFE7]"><Loader2 className="w-8 h-8 animate-spin text-[#DE5117]" /></div>;
    }

    const topDocs = Object.entries(byDoc).sort((a, b) => b[1] - a[1]);

    return (
        <div className="min-h-screen bg-[#F3EFE7]">
            <header className="bg-white border-b border-[#BD4313]/10 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-widest min-h-[44px]">
                        <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
                    </Link>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Analytics</div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Analytics</h1>
                <p className="text-sm text-slate-500 mb-8">Track your document generation usage.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Total Generations</p>
                            <p className="text-3xl font-bold">{total}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Today</p>
                            <p className="text-3xl font-bold text-[#C2410C]">{todayCount}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-4">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-1">Document Types</p>
                            <p className="text-3xl font-bold">{topDocs.length}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-white border-slate-200 mb-8">
                    <CardContent className="p-4">
                        <h2 className="font-bold mb-4">Most Popular Documents</h2>
                        <div className="space-y-2">
                            {topDocs.map(([name, count]) => (
                                <div key={name} className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                                    <span className="text-sm font-medium truncate mr-2">{name}</span>
                                    <span className="text-sm font-bold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200">
                    <CardContent className="p-4">
                        <h2 className="font-bold mb-4">Recent Activity</h2>

                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="border-b"><th className="text-left p-3 text-xs font-bold text-slate-400">Document</th><th className="text-left p-3 text-xs font-bold text-slate-400">Time</th></tr></thead>
                                <tbody>
                                    {recent.map((r, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="p-3 font-medium">{r.docTitle}</td>
                                            <td className="p-3 text-slate-500 text-xs">
                                                {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString("en-IN") : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-2">
                            {recent.slice(0, 10).map((r, i) => (
                                <div key={i} className="bg-slate-50 rounded-lg p-3">
                                    <div className="font-medium text-sm mb-1">{r.docTitle}</div>
                                    <div className="text-xs text-slate-500">
                                        {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}