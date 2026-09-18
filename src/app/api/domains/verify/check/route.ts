/** POST /api/domains/verify/check — prove the challenge was satisfied. */
import { route } from '@/lib/api/handler';
import { verifyCheckRequest } from '@/lib/validation/schemas';
import { checkVerification } from '@/lib/domains/verification';

export const runtime = 'nodejs';

export const POST = route({ schema: verifyCheckRequest }, async ({ body, user }) =>
    checkVerification(user, body.verificationId),
);
