import { cert, getApps, initializeApp, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

let cachedApp: App | null = null;

function createApp(): App {
    if (cachedApp) return cachedApp;

    const existing = getApps();
    if (existing.length > 0) {
        cachedApp = existing[0];
        return cachedApp;
    }

    const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // During BUILD time (NEXT_PHASE), don't throw errors - just use a dummy config
    // The actual values will be available at RUNTIME on Vercel
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.log('⚠️ Skipping Firebase Admin init during build phase');
        cachedApp = initializeApp({ projectId: 'dummy-project-for-build' });
        return cachedApp;
    }

    if (encoded) {
        try {
            const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
            cachedApp = initializeApp({
                credential: cert(json),
                projectId: json.project_id,
            });
            return cachedApp;
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
            throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT format');
        }
    }

    // Fallback for local dev or Google infra
    if (process.env.NODE_ENV !== 'production') {
        cachedApp = initializeApp({ projectId: 'local-dev-project' });
        return cachedApp;
    }

    throw new Error(
        'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT (base64 service account JSON).',
    );
}

// Lazy getters instead of static exports
export function getAdminApp(): App {
    return createApp();
}

export function getAdminAuth() {
    return getAuth(getAdminApp());
}

export function getAdminDb() {
    return getFirestore(getAdminApp());
}

export { FieldValue, Timestamp };