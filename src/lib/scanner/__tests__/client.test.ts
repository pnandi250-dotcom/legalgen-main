import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Scanner Client', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.SCANNER_URL = 'https://scanner.example.com';
    process.env.SCANNER_API_KEY = 'test-scanner-key';
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function isApiError(error: unknown): error is { name: string; code: string; message: string; details?: Record<string, unknown> } {
    return error instanceof Error && error.name === 'ApiError';
  }

  it('throws ApiError when SCANNER_URL is not set', async () => {
    delete process.env.SCANNER_URL;
    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('throws ApiError when SCANNER_API_KEY is not set', async () => {
    delete process.env.SCANNER_API_KEY;
    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('calls scanner with correct headers and body', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          scannerVersion: '1.0',
          url: 'https://example.com',
          finalUrl: 'https://example.com',
          domain: 'example.com',
          scannedAt: new Date().toISOString(),
          title: 'Test Site',
          businessType: { key: 'saas', name: 'SaaS/Tech', confidence: 0.9 },
          technologies: [],
          forms: [],
          policies: [],
          findings: [],
          score: { value: 80, grade: 'B', confidence: 'high' },
          riskLevel: 'LOW',
          checksPerformed: [],
          checksSkipped: [],
        },
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { runScan } = await import('../client');
    const result = await runScan('https://example.com', { requestId: 'req-123' });

    // Check the fetch call was made with correct URL, method, headers, and body
    const fetchCall = (global.fetch as any).mock.calls[0];
    // fetchCall[0] can be a string or URL object
    const calledUrl = fetchCall[0] instanceof URL ? fetchCall[0].toString() : fetchCall[0];
    expect(calledUrl).toBe('https://scanner.example.com/api/scan');
    expect(fetchCall[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-scanner-key',
        'X-Request-Id': 'req-123',
      }),
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    // signal should be an AbortSignal
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);

    expect(result.domain).toBe('example.com');
    expect(result.businessType.key).toBe('saas');
  });

  it('handles 4xx errors from scanner with user-safe message', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: { code: 'BLOCKED_HOST', message: 'That host cannot be scanned' },
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { runScan } = await import('../client');
    try {
      await runScan('https://internal.example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('BAD_REQUEST');
      expect((error as any).message).toBe('That host cannot be scanned');
    }
  });

  it('handles 5xx errors from scanner', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: { code: 'INTERNAL', message: 'Scanner crashed' },
      }),
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('handles network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('handles timeout', async () => {
    (global.fetch as any).mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error('Aborted')), 100))
    );

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com', { timeoutMs: 50 });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
      expect((error as any).message).toBe('That site took too long to respond.');
    }
  });

  it('handles invalid JSON response', async () => {
    const mockResponse = {
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com');
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });
});