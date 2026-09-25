import { describe, it, expect, vi } from 'vitest';

// Mock node:crypto using async factory with importOriginal
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => 'a'.repeat(32)),
    })),
  };
});

// Mock Firebase admin
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
  FieldValue: {
    increment: (n: number) => ({ _increment: n }),
    serverTimestamp: () => new Date(),
  },
}));

// Mock config
vi.mock('@/lib/config', () => ({
  config: {
    quotaIpSalt: 'test-salt',
  },
}));

import { subjectFor, DAILY_LIMITS, utcDay, nextUtcMidnight } from '../quota';

describe('Quota System', () => {
  describe('DAILY_LIMITS', () => {
    it('has correct limits for anonymous users', () => {
      expect(DAILY_LIMITS.anonymous.scan).toBe(1);
      expect(DAILY_LIMITS.anonymous.generate).toBe(3);
      expect(DAILY_LIMITS.anonymous.hunt).toBe(1);
      expect(DAILY_LIMITS.anonymous.export).toBe(0);
    });

    it('has correct limits for free users', () => {
      expect(DAILY_LIMITS.free.scan).toBe(5);
      expect(DAILY_LIMITS.free.generate).toBe(10);
      expect(DAILY_LIMITS.free.hunt).toBe(5);
      expect(DAILY_LIMITS.free.export).toBe(3);
    });

    it('has correct limits for pro users', () => {
      expect(DAILY_LIMITS.pro.scan).toBe(100);
      expect(DAILY_LIMITS.pro.generate).toBe(200);
      expect(DAILY_LIMITS.pro.hunt).toBe(100);
      expect(DAILY_LIMITS.pro.export).toBe(200);
    });

    it('has correct limits for agency users', () => {
      expect(DAILY_LIMITS.agency.scan).toBe(1000);
      expect(DAILY_LIMITS.agency.generate).toBe(2000);
      expect(DAILY_LIMITS.agency.hunt).toBe(1000);
      expect(DAILY_LIMITS.agency.export).toBe(2000);
    });
  });

  describe('subjectFor', () => {
    it('returns uid for authenticated users', () => {
      const user = {
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        plan: 'pro' as const,
        orgId: null,
      };
      const request = new Request('https://example.com');
      const result = subjectFor(user, request);
      expect(result.subject).toBe('uid:user-123');
      expect(result.plan).toBe('pro');
    });

    it('returns hashed IP for anonymous users', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });
      const result = subjectFor(null, request);
      expect(result.subject).toMatch(/^ip:[a-f0-9]{32}$/);
      expect(result.plan).toBe('anonymous');
    });

    it('handles missing x-forwarded-for header', () => {
      const request = new Request('https://example.com');
      const result = subjectFor(null, request);
      expect(result.subject).toMatch(/^ip:[a-f0-9]{32}$/);
      expect(result.plan).toBe('anonymous');
    });

    it('uses first IP from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1, 172.16.0.1' },
      });
      const result = subjectFor(null, request);
      expect(result.subject).toMatch(/^ip:[a-f0-9]{32}$/);
    });
  });

  describe('utcDay', () => {
    it('returns YYYY-MM-DD format', () => {
      const date = new Date('2024-01-15T12:30:45Z');
      expect(utcDay(date)).toBe('2024-01-15');
    });

    it('handles end of month', () => {
      const date = new Date('2024-01-31T23:59:59Z');
      expect(utcDay(date)).toBe('2024-01-31');
    });

    it('handles leap year', () => {
      const date = new Date('2024-02-29T00:00:00Z');
      expect(utcDay(date)).toBe('2024-02-29');
    });
  });

  describe('nextUtcMidnight', () => {
    it('returns next midnight in ISO format', () => {
      const date = new Date('2024-01-15T12:30:45Z');
      const result = nextUtcMidnight(date);
      expect(result).toBe('2024-01-16T00:00:00.000Z');
    });

    it('handles end of day', () => {
      const date = new Date('2024-01-15T23:59:59Z');
      const result = nextUtcMidnight(date);
      expect(result).toBe('2024-01-16T00:00:00.000Z');
    });
  });
});