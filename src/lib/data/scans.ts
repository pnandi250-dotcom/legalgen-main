/** Persisted scans, so history, re-scan diffing and alerts become possible. */
import { getAdminDb, FieldValue, Timestamp } from '@/lib/firebase/admin';
import { COLLECTIONS } from './schema';
import type { ScannerResult } from '@/lib/scanner/client';
import type { AuthedUser } from '@/lib/auth/require-user';
import { forbidden, notFound } from '@/lib/api/errors';

const RETENTION_DAYS = 180;

export async function saveScan(
    user: AuthedUser | null,
    result: ScannerResult,
    meta: { domainVerified: boolean },
): Promise<string> {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const scanRef = db.collection(COLLECTIONS.scans).doc();
    const batch = db.batch();

    batch.set(scanRef, {
        id: scanRef.id,
        ownerUid: user?.uid ?? null,
        orgId: user?.orgId ?? null,
        url: result.url,
        domain: result.domain,
        status: 'complete',
        domainVerified: meta.domainVerified,
        scannerVersion: result.scannerVersion,
        score: result.score.value,
        grade: result.score.grade,
        riskLevel: result.riskLevel,
        confidence: result.score.confidence,
        checksPerformed: result.checksPerformed,
        checksSkipped: result.checksSkipped,
        error: null,
        startedAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000),
    });

    // Findings are separate documents: they are queried, filtered and counted
    // independently, and a scan with 200 findings must not hit the 1 MiB cap.
    for (const finding of result.findings.slice(0, 200)) {
        const ref = db.collection(COLLECTIONS.scanFindings).doc(); // ✅ CHANGED adminDb TO db
        batch.set(ref, {
            id: ref.id,
            scanId: scanRef.id,
            ownerUid: user?.uid ?? null,
            ...finding,
            createdAt: FieldValue.serverTimestamp(),
        });
    }

    await batch.commit();
    return scanRef.id;
}

export async function getScanWithFindings(user: AuthedUser, scanId: string) {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const snap = await db.collection(COLLECTIONS.scans).doc(scanId).get(); // ✅ CHANGED adminDb TO db
    if (!snap.exists) throw notFound('That scan no longer exists.');
    const scan = snap.data()!;
    if (scan.ownerUid !== user.uid && (!user.orgId || scan.orgId !== user.orgId)) {
        throw forbidden('That scan belongs to another account.');
    }
    const findings = await db // ✅ CHANGED adminDb TO db
        .collection(COLLECTIONS.scanFindings)
        .where('scanId', '==', scanId)
        .limit(200)
        .get();
    return { scan, findings: findings.docs.map((d) => d.data()) };
}

/** Compare the two most recent scans of a domain: the re-scan story (P2-02). */
export async function diffLatestScans(user: AuthedUser, domain: string) {
    const db = getAdminDb(); // ✅ ADDED THIS LINE
    const snap = await db // ✅ CHANGED adminDb TO db
        .collection(COLLECTIONS.scans)
        .where('ownerUid', '==', user.uid)
        .where('domain', '==', domain)
        .orderBy('completedAt', 'desc')
        .limit(2)
        .get();

    if (snap.docs.length < 2) return null;
    const [latest, previous] = snap.docs;
    
    // Fetch findings for both to compare properly
    const latestFindingsSnap = await db.collection(COLLECTIONS.scanFindings).where('scanId', '==', latest.id).get();
    const previousFindingsSnap = await db.collection(COLLECTIONS.scanFindings).where('scanId', '==', previous.id).get();
    
    const currentSet = new Set(latestFindingsSnap.docs.map(d => d.data().type));
    const previousSet = new Set(previousFindingsSnap.docs.map(d => d.data().type));
    
    const resolved = [...previousSet].filter(x => !currentSet.has(x));
    const newIssues = [...currentSet].filter(x => !previousSet.has(x));

    return {
        previousScanId: previous.id,
        latestScanId: latest.id,
        scoreChange: (latest.data().score || 0) - (previous.data().score || 0),
        resolvedIssues: resolved,
        newIssues: newIssues,
    };
}