import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Configuration Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('returns config with all required fields', async () => {
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.QUOTA_IP_SALT = 'test-salt';
      process.env.NODE_ENV = 'development';

      const { getConfig } = await import('../config');
      const config = getConfig();

      expect(config.scannerUrl).toBe('https://scanner.example.com');
      expect(config.scannerApiKey).toBe('test-key');
      expect(config.quotaIpSalt).toBe('test-salt');
      expect(config.nodeEnv).toBe('development');
    });

    it('uses default quota salt when not set', async () => {
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.NODE_ENV = 'development';
      delete process.env.QUOTA_IP_SALT;

      const { getConfig } = await import('../config');
      const config = getConfig();

      expect(config.quotaIpSalt).toBe('legalgen-dev-salt-change-in-production');
    });

    it('warns when required vars missing in non-test env', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SCANNER_URL;
      delete process.env.SCANNER_API_KEY;
      delete process.env.QUOTA_IP_SALT;

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { getConfig } = await import('../config');
      getConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing required environment variables')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateConfigForProduction', () => {
    it('throws when SCANNER_URL missing in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.FIREBASE_SERVICE_ACCOUNT = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50In0=';
      process.env.QUOTA_IP_SALT = 'custom-salt';
      delete process.env.SCANNER_URL;

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).toThrow('SCANNER_URL is required in production');
    });

    it('throws when SCANNER_API_KEY missing in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.FIREBASE_SERVICE_ACCOUNT = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50In0=';
      process.env.QUOTA_IP_SALT = 'custom-salt';
      delete process.env.SCANNER_API_KEY;

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).toThrow('SCANNER_API_KEY is required in production');
    });

    it('throws when FIREBASE_SERVICE_ACCOUNT missing in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.QUOTA_IP_SALT = 'custom-salt';
      delete process.env.FIREBASE_SERVICE_ACCOUNT;

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).toThrow('FIREBASE_SERVICE_ACCOUNT is required in production');
    });

    it('throws when QUOTA_IP_SALT is default in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.FIREBASE_SERVICE_ACCOUNT = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50In0=';
      process.env.QUOTA_IP_SALT = 'legalgen-dev-salt-change-in-production';

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).toThrow('QUOTA_IP_SALT must be changed from default in production');
    });

    it('passes when all production vars are set correctly', async () => {
      process.env.NODE_ENV = 'production';
      process.env.SCANNER_URL = 'https://scanner.example.com';
      process.env.SCANNER_API_KEY = 'test-key';
      process.env.FIREBASE_SERVICE_ACCOUNT = 'eyJ0eXBlIjoic2VydmljZV9hY2NvdW50In0=';
      process.env.QUOTA_IP_SALT = 'custom-production-salt';

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).not.toThrow();
    });

    it('does not validate in non-production env', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SCANNER_URL;
      delete process.env.SCANNER_API_KEY;
      delete process.env.FIREBASE_SERVICE_ACCOUNT;
      delete process.env.QUOTA_IP_SALT;

      const { validateConfigForProduction } = await import('../config');
      expect(() => validateConfigForProduction()).not.toThrow();
    });
  });
});