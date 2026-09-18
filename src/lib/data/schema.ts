/**
 * Firestore data model. Fixes F-07 (world-writable analytics) at the rules
 * level and P1-02 (nothing persisted, nothing versioned).
 *
 * Design rules:
 *  - Every write that carries entitlement happens server-side via Admin SDK.
 *  - A document is metadata; its text lives in immutable versions.
 *  - A version records the ANSWERS and the clause-library version, so any
 *    document can be regenerated when the law (or the clause) changes.
 */
import type { Timestamp } from 'firebase-admin/firestore';

export const COLLECTIONS = {
    users: 'users',
    organisations: 'organisations',
    memberships: 'memberships',
    documents: 'documents',
    documentVersions: 'documentVersions',
    scans: 'scans',
    scanFindings: 'scanFindings',
    domainVerifications: 'domainVerifications',
    quotas: 'quotas',
    events: 'events',
    subscriptions: 'subscriptions',
    auditLog: 'auditLog',
} as const;

export type Jurisdiction = 'IN' | 'EU' | 'UK' | 'US' | 'US-CA' | 'GLOBAL';
export type Plan = 'free' | 'pro' | 'agency';

export interface UserRecord {
    uid: string;
    email: string | null;
    plan: Plan;
    orgId: string | null;
    createdAt: Timestamp;
    lastSeenAt: Timestamp;
}

export interface DocumentRecord {
    id: string;
    ownerUid: string;
    orgId: string | null;
    documentType: string;
    jurisdiction: Jurisdiction;
    title: string;
    /** Points at the version currently served on the hosted URL. */
    currentVersionId: string | null;
    publishedVersionId: string | null;
    /** Stable public slug for the hosted policy URL (P2-01). */
    publicSlug: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DocumentVersionRecord {
    id: string;
    documentId: string;
    ownerUid: string;
    /** Monotonic, human-quotable: v1, v2, v3. */
    version: number;
    /** The inputs. This is what makes regeneration and diffing possible. */
    answers: Record<string, string | number | boolean | string[]>;
    jurisdiction: Jurisdiction;
    /** Which clause library produced this text. */
    clauseLibraryVersion: string;
    generatorVersion: string;
    /** Rendered output. Moves to Cloud Storage above INLINE_BODY_LIMIT. */
    bodyHtml: string | null;
    bodyStoragePath: string | null;
    contentHash: string;
    effectiveFrom: Timestamp | null;
    createdAt: Timestamp;
    createdByUid: string;
}

/** Firestore documents cap at 1 MiB; keep a wide margin. */
export const INLINE_BODY_LIMIT = 200 * 1024;

export type ScanStatus = 'queued' | 'running' | 'complete' | 'failed';
export type Confidence = 'high' | 'medium' | 'low';

export interface ScanRecord {
    id: string;
    ownerUid: string | null;
    orgId: string | null;
    url: string;
    domain: string;
    status: ScanStatus;
    /** Was the caller's ownership of this domain verified? (F-06) */
    domainVerified: boolean;
    scannerVersion: string;
    /** Only set for checks we actually performed. */
    score: number | null;
    grade: string | null;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
    confidence: Confidence | null;
    /** Explicit record of what was and was not checked (P1-03). */
    checksPerformed: string[];
    checksSkipped: Array<{ check: string; reason: string }>;
    error: { code: string; message: string } | null;
    startedAt: Timestamp;
    completedAt: Timestamp | null;
    expiresAt: Date | null;
}

export interface ScanFindingRecord {
    id: string;
    scanId: string;
    ownerUid: string | null;
    kind: 'missing_policy' | 'weak_policy' | 'tracker_without_notice' | 'form_without_notice' | 'signal';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    detail: string;
    /** Statute reference, carried from the rule that produced the finding. */
    regulation: { name: string; section: string | null; citationUrl: string | null } | null;
    /** What we saw, so the user can check our work. */
    evidence: { url: string | null; httpStatus: number | null; matchedText: string | null };
    confidence: Confidence;
    suggestedDocumentType: string | null;
    createdAt: Timestamp;
}

export type VerificationMethod = 'file' | 'dns' | 'meta';

export interface DomainVerificationRecord {
    id: string;
    uid: string;
    domain: string;
    method: VerificationMethod;
    /** crypto-random, not Math.random (F-06). */
    token: string;
    verified: boolean;
    attempts: number;
    lastCheckedAt: Timestamp | null;
    lastError: string | null;
    createdAt: Timestamp;
    verifiedAt: Timestamp | null;
    expiresAt: Date;
}

export interface EventRecord {
    uid: string | null;
    orgId: string | null;
    name: 'document_generated' | 'document_published' | 'scan_completed' | 'export_created';
    properties: Record<string, string | number | boolean | null>;
    createdAt: Timestamp;
    expiresAt: Date;
}
