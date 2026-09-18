/**
 * Firebase Admin singleton — the server-side trust boundary.
 * Fixes F-05: the app previously had no way to verify a caller's identity.
 *
 * Credentials: set FIREBASE_SERVICE_ACCOUNT to the base64 of the service
 * account JSON (one env var, no file on disk). On Google infrastructure,
 * leave it unset and application default credentials are used.
 */
import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

function createApp(): App {
    const existing = getApps();
    if (existing.length > 0) return existing[0];

    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (encoded) {
        const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
        return initializeApp({
            credential: cert(json),
            projectId: json.project_id,
        });
    }
    if (process.env.NODE_ENV === 'production' && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GCLOUD_PROJECT) {
        throw new Error(
            'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT (base64 service account JSON).',
        );
    }
    return initializeApp({ credential: applicationDefault() });
}

export const adminApp = createApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export { FieldValue, Timestamp };
