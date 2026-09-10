import { initializeApp, getApps } from "firebase/app";
import { firebaseConfig } from "./config";
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore(app);

// Initialize Analytics (client-side only, safe for SSR)
let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

/**
 * Call this whenever a user generates a document.
 * 
 * It does TWO things:
 * 1. Logs to Firebase Analytics (free dashboard at console.firebase.google.com)
 * 2. Saves a record in Firestore "generations" collection (for custom queries)
 */
export async function trackGeneration(data: {
    docType: string;
    docTitle: string;
    userId: string | null;
    userEmail: string | null;
}) {
    const { docType, docTitle, userId, userEmail } = data;

    // 1. Firebase Analytics event
    if (analytics) {
        logEvent(analytics, "document_generated", {
            doc_type: docType,
            doc_title: docTitle,
            user_id: userId || "anonymous",
            is_logged_in: !!userId,
        });
    }

    // 2. Firestore log (for your custom dashboard)
    try {
        await addDoc(collection(db, "generations"), {
            docType,
            docTitle,
            userId: userId || null,
            userEmail: userEmail || null,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        // Silent fail — don't block the user if Firestore write fails
        console.warn("Could not log generation:", err);
    }
}

/**
 * Track compliance audit runs
 * 🔒 UPDATED: Now includes companyName and userRole for better tracking
 */
export async function trackAudit(data: {
    url: string;
    score: number | null;
    userId: string | null;
    companyName?: string | null;  // ← NEW
    userRole?: string | null;     // ← NEW
}) {
    const { url, score, userId, companyName, userRole } = data;

    if (analytics) {
        logEvent(analytics, "compliance_audit", {
            target_url: url,
            score,
            user_id: userId || "anonymous",
            company_name: companyName || "not_provided",  // ← NEW
            user_role: userRole || "not_provided",         // ← NEW
        });
    }

    try {
        await addDoc(collection(db, "audits"), {
            url,
            score,
            userId: userId || null,
            companyName: companyName || null,  // ← NEW
            userRole: userRole || null,       // ← NEW
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn("Could not log audit:", err);
    }
}