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

  function mockHealthOk() {
    (global.fetch as any).mockImplementation((url: string | URL) => {
      const urlStr = url instanceof URL ? url.toString() : url;
      if (urlStr.endsWith('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true }),
        });
      }
      return Promise.resolve({
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
      });
    });
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

  it('calls scanner with correct headers and body (includes warmup)', async () => {
    mockHealthOk();

    const { runScan } = await import('../client');
    const result = await runScan('https://example.com', { requestId: 'req-123' });

    // Should have made 2 calls: health check + scan
    expect(global.fetch).toHaveBeenCalledTimes(2);

    // First call: health check
    const healthCall = (global.fetch as any).mock.calls[0];
    const healthUrl = healthCall[0] instanceof URL ? healthCall[0].toString() : healthCall[0];
    expect(healthUrl).toBe('https://scanner.example.com/health');
    expect(healthCall[1]).toMatchObject({
      method: 'GET',
      headers: expect.objectContaining({
        'X-API-Key': 'test-scanner-key',
        'X-Request-Id': 'req-123',
      }),
    });

    // Second call: actual scan
    const scanCall = (global.fetch as any).mock.calls[1];
    const scanUrl = scanCall[0] instanceof URL ? scanCall[0].toString() : scanCall[0];
    expect(scanUrl).toBe('https://scanner.example.com/api/scan');
    expect(scanCall[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'X-API-Key': 'test-scanner-key',
        'X-Request-Id': 'req-123',
      }),
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    expect(scanCall[1].signal).toBeInstanceOf(AbortSignal);

    expect(result.domain).toBe('example.com');
    expect(result.businessType.key).toBe('saas');
  });

  it('handles 4xx errors from scanner with user-safe message', async () => {
    mockHealthOk();

    // Override the second call (scan) to return 4xx
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'BLOCKED_HOST', message: 'That host cannot be scanned' },
        }),
      }); // scan

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

  it('retries on 5xx errors and eventually throws UPSTREAM_UNAVAILABLE', async () => {
    // Health check succeeds
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'INTERNAL', message: 'Scanner crashed' },
        }),
      }); // scan (will retry)

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com', { retries: 1 }); // Only 1 retry for faster test
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
      // Should have: health + initial scan + 1 retry = 3 calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
    }
  });

  it('handles network errors', async () => {
    mockHealthOk();

    // Scan fails with network error
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockRejectedValueOnce(new Error('Network error')); // scan

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com', { retries: 1 });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('handles timeout with retries', async () => {
    mockHealthOk();

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Aborted')), 100))
      ); // scan timeout

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com', { timeoutMs: 50, retries: 1 });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
      expect((error as any).message).toContain('retries');
    }
  });

  it('handles invalid JSON response', async () => {
    mockHealthOk();

    // Scan returns invalid JSON - should retry and eventually fail
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      }) // scan (fails JSON parse)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      }); // health retry
      // scan retry - but we don't mock it, so it will fail

    const { runScan } = await import('../client');
    try {
      await runScan('https://example.com', { retries: 1 });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('UPSTREAM_UNAVAILABLE');
    }
  });

  it('does not retry on 4xx errors', async () => {
    mockHealthOk();

    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) }) // health
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'BLOCKED_HOST', message: 'That host cannot be scanned' },
        }),
      }); // scan (4xx - no retry)

    const { runScan } = await import('../client');
    try {
      await runScan('https://internal.example.com', { retries: 3 });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as any).code).toBe('BAD_REQUEST');
      // Should NOT retry on 4xx: health + 1 scan = 2 calls
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }
  });
});