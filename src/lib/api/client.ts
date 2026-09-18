/**
 * Client-side API helper. Attaches the Firebase ID token to every request so
 * the server can verify identity (F-05), and turns the API's error envelope
 * into something a component can render without alert().
 */
'use client';

import { auth } from '@/lib/firebase/config';

export class ApiClientError extends Error {
    constructor(
        readonly code: string,
        message: string,
        readonly status: number,
        readonly fields?: Record<string, string>,
        readonly requestId?: string,
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

export async function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as
        | { success: boolean; data?: TResponse; error?: { code: string; message: string; fields?: Record<string, string> }; requestId?: string }
        | null;

    if (!response.ok || !payload?.success) {
        throw new ApiClientError(
            payload?.error?.code ?? 'REQUEST_FAILED',
            payload?.error?.message ?? 'Something went wrong. Try again.',
            response.status,
            payload?.error?.fields,
            payload?.requestId,
        );
    }
    return payload.data as TResponse;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    const response = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = (await response.json().catch(() => null)) as
        | { success: boolean; data?: TResponse; error?: { code: string; message: string } }
        | null;
    if (!response.ok || !payload?.success) {
        throw new ApiClientError(
            payload?.error?.code ?? 'REQUEST_FAILED',
            payload?.error?.message ?? 'Could not load that.',
            response.status,
        );
    }
    return payload.data as TResponse;
}

/**
 * Call once after sign-in so the middleware-protected routes work, and once
 * on sign-out. Pairs with /api/auth/session.
 */
export async function establishSession(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken(true);
    await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
    });
}

export async function clearSession(): Promise<void> {
    await fetch('/api/auth/session', { method: 'DELETE' });
}
