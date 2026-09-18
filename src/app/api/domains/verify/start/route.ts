/** POST /api/domains/verify/start — issue an ownership challenge. */
import { route } from '@/lib/api/handler';
import { verifyStartRequest } from '@/lib/validation/schemas';
import { startVerification } from '@/lib/domains/verification';

export const runtime = 'nodejs';

export const POST = route({ schema: verifyStartRequest }, async ({ body, user }) =>
    startVerification(user, body.domain, body.method),
);
