/**
 * GET  /api/documents  — the caller's documents, paginated server-side.
 * POST /api/documents  — save a new version of a document.
 *
 * Replaces the client writing straight to Firestore with only rendered HTML.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { route } from '@/lib/api/handler';
import { saveDocumentRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import { requireUser } from '@/lib/auth/require-user';
import { listDocuments, saveDocumentVersion } from '@/lib/data/documents';
import { renderDocument, CLAUSE_LIBRARY_VERSION, GENERATOR_VERSION } from '@/lib/clause-library/render';

export const runtime = 'nodejs';

export const POST = route({ schema: saveDocumentRequest }, async ({ body, user, request }) => {
    await consumeQuota(user, request, 'generate');

    // Render on the server: the client no longer decides what gets stored,
    // and the clause library is not shipped to the browser.
    const rendered = renderDocument({
        documentType: body.documentType,
        jurisdiction: body.jurisdiction,
        answers: body.answers,
    });

    const result = await saveDocumentVersion(user, {
        documentId: body.documentId,
        documentType: body.documentType,
        jurisdiction: body.jurisdiction,
        title: body.title,
        answers: body.answers,
        bodyHtml: rendered.html,
        clauseLibraryVersion: CLAUSE_LIBRARY_VERSION,
        generatorVersion: GENERATOR_VERSION,
        publish: body.publish ?? false,
    });

    return { ...result, title: body.title, clauseLibraryVersion: CLAUSE_LIBRARY_VERSION };
});

export async function GET(request: NextRequest) {
    try {
        const user = await requireUser(request);
        const limit = Number(request.nextUrl.searchParams.get('limit') ?? 25);
        const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined;
        const data = await listDocuments(user, Number.isFinite(limit) ? limit : 25, cursor);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        const status = error && typeof error === 'object' && 'status' in error ? Number(error.status) : 500;
        return NextResponse.json(
            { success: false, error: { code: 'REQUEST_FAILED', message: 'Could not load your documents.' } },
            { status },
        );
    }
}
