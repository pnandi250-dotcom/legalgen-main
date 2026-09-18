/**
 * One route wrapper for every API handler: request id, identity, schema
 * validation, structured logging, and error shaping.
 *
 * Replaces the copy-pasted try/catch + console.log in every old route and
 * closes F-11 (leaked internals) and part of F-12 (no input validation).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ApiError, badRequest } from './errors';
import { requireUser, getUser, type AuthedUser } from '@/lib/auth/require-user';
import { UrlGuardError } from '@/lib/security/url-guard';

export interface HandlerContext<TBody> {
    request: NextRequest;
    body: TBody;
    user: AuthedUser;
    requestId: string;
    log: (event: string, data?: Record<string, unknown>) => void;
}

interface RouteOptions<TBody> {
    /** 'required' is the default. 'optional' exposes user as possibly anonymous. */
    auth?: 'required' | 'anonymous';
    schema?: ZodType<TBody>;
}

export type AnonymousContext<TBody> = Omit<HandlerContext<TBody>, 'user'> & { user: AuthedUser | null };

export function route<TBody = unknown>(
    options: RouteOptions<TBody>,
    handler: (ctx: HandlerContext<TBody>) => Promise<NextResponse | unknown>,
) {
    return async function POST(request: NextRequest) {
        const requestId = crypto.randomUUID();
        const startedAt = Date.now();
        const log = (event: string, data: Record<string, unknown> = {}) => {
            // Structured single-line JSON: greppable, parseable by any log sink.
            console.log(JSON.stringify({ requestId, event, path: request.nextUrl.pathname, ...data }));
        };

        try {
            const user =
                options.auth === 'anonymous' ? await getUser(request) : await requireUser(request);

            let body = undefined as TBody;
            if (options.schema) {
                let raw: unknown;
                try {
                    raw = await request.json();
                } catch {
                    throw badRequest('Send a JSON body.');
                }
                body = options.schema.parse(raw);
            }

            const result = await handler({ request, body, user: user as AuthedUser, requestId, log });
            log('ok', { ms: Date.now() - startedAt, uid: user?.uid ?? null });

            if (result instanceof NextResponse) return result;
            return NextResponse.json(
                { success: true, data: result, requestId },
                { headers: { 'x-request-id': requestId } },
            );
        } catch (error) {
            return toErrorResponse(error, requestId, log, Date.now() - startedAt);
        }
    };
}

function toErrorResponse(
    error: unknown,
    requestId: string,
    log: (event: string, data?: Record<string, unknown>) => void,
    ms: number,
) {
    const headers = { 'x-request-id': requestId };

    if (error instanceof ZodError) {
        log('validation_failed', { ms, issues: error.issues });
        return NextResponse.json(
            {
                success: false,
                error: { code: 'BAD_REQUEST', message: 'Some fields need fixing.', fields: fieldErrors(error) },
                requestId,
            },
            { status: 400, headers },
        );
    }

    if (error instanceof UrlGuardError) {
        // Guard messages are written to be user-safe and explain the refusal.
        log('url_rejected', { ms, code: error.code });
        return NextResponse.json(
            { success: false, error: { code: error.code, message: error.message }, requestId },
            { status: error.code === 'TIMEOUT' || error.code === 'UPSTREAM_ERROR' ? 502 : 400, headers },
        );
    }

    if (error instanceof ApiError) {
        log('api_error', { ms, code: error.code });
        return NextResponse.json(
            { success: false, error: { code: error.code, message: error.message, ...error.details }, requestId },
            { status: error.status, headers },
        );
    }

    // Unexpected: log everything, tell the client nothing.
    log('unhandled_error', {
        ms,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
        {
            success: false,
            error: { code: 'INTERNAL', message: 'Something went wrong on our side. Try again shortly.' },
            requestId,
        },
        { status: 500, headers },
    );
}

function fieldErrors(error: ZodError): Record<string, string> {
    const out: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join('.') || '_';
        if (!out[key]) out[key] = issue.message;
    }
    return out;
}
