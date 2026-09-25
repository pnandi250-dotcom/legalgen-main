import { beforeAll, afterAll, vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class {
    constructor(public url: string, public init?: RequestInit) {}
    headers = new Headers(init?.headers);
    method = init?.method || 'GET';
    body = init?.body;
    json = async () => JSON.parse(this.body as string);
    nextUrl = new URL(this.url);
  },
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      ...data,
      status: init?.status || 200,
      headers: init?.headers,
    }),
  },
}));

// Mock Firebase Admin
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => undefined }),
        set: async () => {},
      }),
    }),
    runTransaction: async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        get: async () => ({ exists: false, data: () => undefined }),
        set: () => tx,
      };
      return fn(tx);
    },
  }),
  getAdminAuth: () => ({
    verifyIdToken: async () => ({ uid: 'test-uid', email: 'test@example.com', email_verified: true, plan: 'free' }),
    verifySessionCookie: async () => ({ uid: 'test-uid', email: 'test@example.com', email_verified: true, plan: 'free' }),
  }),
  FieldValue: {
    increment: (n: number) => ({ _increment: n }),
    serverTimestamp: () => new Date(),
  },
  Timestamp: {
    now: () => new Date(),
  },
}));

// DO NOT mock crypto here - let individual tests mock it
// DO NOT set test environment variables here - let individual tests set their own