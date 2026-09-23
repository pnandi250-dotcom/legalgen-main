/**
 * Versioned document storage. Replaces saveDocumentToDb(), which kept only
 * rendered HTML and therefore made regeneration, diffing, publishing and
 * auto-update impossible (P1-02).
 */
import { createHash } from 'node:crypto';
import { getAdminDb, FieldValue, Timestamp } from '@/lib/firebase/admin';
import { COLLECTIONS, INLINE_BODY_LIMIT, type DocumentRecord, type Jurisdiction } from './schema';
import { forbidden, notFound } from '@/lib/api/errors';
import type { AuthedUser } from '@/lib/auth/require-user';

export interface SaveVersionInput {
    documentId?: string;
    documentType: string;
    jurisdiction: Jurisdiction;
    title: string;
    answers: Record<string, string | number | boolean | string[]>;
    bodyHtml: string;
    clauseLibraryVersion: string;
    generatorVersion: string;
    publish: boolean;
}

export interface SaveVersionResult {
    documentId: string;
    versionId: string;
    version: number;
    published: boolean;
    unchanged: boolean;
}

const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

export function hashBody(body: string): string {
    return createHash('sha256').update(body).digest('hex');
}

export async function saveDocumentVersion(user: AuthedUser, input: SaveVersionInput): Promise<SaveVersionResult> {
    if (input.bodyHtml.length > INLINE_BODY_LIMIT) {
        // Keep the schema honest rather than silently truncating: bodies this
        // large belong in Cloud Storage (see DocumentVersionRecord).
        throw forbidden('This document is too large to store inline. Enable Cloud Storage export first.');
    }

    const contentHash = hashBody(input.bodyHtml);
    const db = getAdminDb();
    const docsRef = db.collection(COLLECTIONS.documents);
    const versionsRef = db.collection(COLLECTIONS.documentVersions);

    return db.runTransaction(async (tx) => {
        let documentRef = input.documentId ? docsRef.doc(input.documentId) : docsRef.doc();
        let version = 1;

        if (input.documentId) {
            const snap = await tx.get(documentRef);
            if (!snap.exists) throw notFound('That document no longer exists.');
            const existing = snap.data() as DocumentRecord;
            if (existing.ownerUid !== user.uid && (!user.orgId || existing.orgId !== user.orgId)) {
                throw forbidden('That document belongs to another account.');
            }

            // Skip a no-op version: identical answers and identical output.
            if (existing.currentVersionId) {
                const currentSnap = await tx.get(versionsRef.doc(existing.currentVersionId));
                const current = currentSnap.data();
                if (current?.contentHash === contentHash) {
                    return {
                        documentId: documentRef.id,
                        versionId: existing.currentVersionId,
                        version: current.version as number,
                        published: existing.publishedVersionId === existing.currentVersionId,
                        unchanged: true,
                    };
                }
                version = ((current?.version as number | undefined) ?? 0) + 1;
            }
        }

        const versionRef = versionsRef.doc();
        tx.set(versionRef, {
            id: versionRef.id,
            documentId: documentRef.id,
            ownerUid: user.uid,
            version,
            answers: input.answers,
            jurisdiction: input.jurisdiction,
            clauseLibraryVersion: input.clauseLibraryVersion,
            generatorVersion: input.generatorVersion,
            bodyHtml: input.bodyHtml,
            bodyStoragePath: null,
            contentHash,
            effectiveFrom: input.publish ? FieldValue.serverTimestamp() : null,
            createdAt: FieldValue.serverTimestamp(),
            createdByUid: user.uid,
        });

        tx.set(
            documentRef,
            {
                id: documentRef.id,
                ownerUid: user.uid,
                orgId: user.orgId,
                documentType: input.documentType,
                jurisdiction: input.jurisdiction,
                title: input.title,
                currentVersionId: versionRef.id,
                ...(input.publish ? { publishedVersionId: versionRef.id } : {}),
                publicSlug: `${slugify(input.title)}-${documentRef.id.slice(0, 8)}`,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
        );

        return {
            documentId: documentRef.id,
            versionId: versionRef.id,
            version,
            published: input.publish,
            unchanged: false,
        };
    });
}

export async function listDocuments(user: AuthedUser, limit = 25, cursor?: string) {
    const db = getAdminDb();
    let query = db
        .collection(COLLECTIONS.documents)
        .where('ownerUid', '==', user.uid)
        .orderBy('updatedAt', 'desc')
        .limit(Math.min(limit, 100));

    if (cursor) {
        const cursorSnap = await db.collection(COLLECTIONS.documents).doc(cursor).get();
        if (cursorSnap.exists) query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    return {
        documents: snap.docs.map((d) => {
            const data = d.data();
            return {
                id: d.id,
                title: data.title,
                documentType: data.documentType,
                jurisdiction: data.jurisdiction,
                publicSlug: data.publicSlug ?? null,
                isPublished: Boolean(data.publishedVersionId),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
            };
        }),
        nextCursor: snap.docs.length === Math.min(limit, 100) ? snap.docs[snap.docs.length - 1].id : null,
    };
}

export async function listVersions(user: AuthedUser, documentId: string) {
    const db = getAdminDb();
    const docSnap = await db.collection(COLLECTIONS.documents).doc(documentId).get();
    if (!docSnap.exists) throw notFound('That document no longer exists.');
    const record = docSnap.data() as DocumentRecord;
    if (record.ownerUid !== user.uid && (!user.orgId || record.orgId !== user.orgId)) {
        throw forbidden('That document belongs to another account.');
    }

    const snap = await db
        .collection(COLLECTIONS.documentVersions)
        .where('documentId', '==', documentId)
        .orderBy('version', 'desc')
        .limit(50)
        .get();

    return snap.docs.map((d) => {
        const data = d.data();
        return {
            id: d.id,
            version: data.version,
            jurisdiction: data.jurisdiction,
            clauseLibraryVersion: data.clauseLibraryVersion,
            contentHash: data.contentHash,
            isPublished: record.publishedVersionId === d.id,
            createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        };
    });
}