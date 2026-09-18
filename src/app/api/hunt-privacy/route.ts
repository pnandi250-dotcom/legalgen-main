/**
 * POST /api/hunt-privacy
 * Finds a site's published policies. Now metered and SSRF-guarded; the
 * hunter itself must use safeFetch for every candidate URL.
 */
import { route } from '@/lib/api/handler';
import { huntRequest } from '@/lib/validation/schemas';
import { consumeQuota } from '@/lib/quota';
import { huntPrivacyPolicy } from '@/lib/legalgen/privacy-hunter';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = route({ schema: huntRequest, auth: 'anonymous' }, async ({ body, user, request }) => {
    const quota = await consumeQuota(user, request, 'hunt');
    const result = await huntPrivacyPolicy(body.url);
    return { ...result, quota: { remaining: quota.remaining, resetsAt: quota.resetsAt } };
});
