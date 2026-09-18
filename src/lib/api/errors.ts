/**
 * Typed API errors. Fixes part of F-11: internal messages were returned to
 * clients verbatim. Clients get a stable code and a safe message plus a
 * request id; the detail goes to the logs only.
 */
export type ErrorCode =
    | 'BAD_REQUEST'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'QUOTA_EXCEEDED'
    | 'DOMAIN_NOT_VERIFIED'
    | 'UPSTREAM_UNAVAILABLE'
    | 'RATE_LIMITED'
    | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
    BAD_REQUEST: 400,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    QUOTA_EXCEEDED: 429,
    DOMAIN_NOT_VERIFIED: 403,
    UPSTREAM_UNAVAILABLE: 502,
    RATE_LIMITED: 429,
    INTERNAL: 500,
};

export class ApiError extends Error {
    readonly status: number;
    constructor(
        readonly code: ErrorCode,
        /** Safe to show a user. Say what happened and what to do next. */
        message: string,
        /** Extra structured context for the client (never internal detail). */
        readonly details?: Record<string, unknown>,
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = STATUS[code];
    }
}

export const badRequest = (message: string, details?: Record<string, unknown>) =>
    new ApiError('BAD_REQUEST', message, details);
export const unauthenticated = (message = 'Sign in to continue.') => new ApiError('UNAUTHENTICATED', message);
export const forbidden = (message = 'You do not have access to this.') => new ApiError('FORBIDDEN', message);
export const notFound = (message = 'Not found.') => new ApiError('NOT_FOUND', message);
