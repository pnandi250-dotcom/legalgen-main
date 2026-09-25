/**
 * Environment configuration validation.
 * Validates required env vars at startup and provides typed access.
 */

interface Config {
  scannerUrl: string;
  scannerApiKey: string;
  quotaIpSalt: string;
  firebaseServiceAccount?: string;
  nodeEnv: string;
  nextPhase?: string;
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) return cachedConfig;

  const required = {
    SCANNER_URL: process.env.SCANNER_URL,
    SCANNER_API_KEY: process.env.SCANNER_API_KEY,
    QUOTA_IP_SALT: process.env.QUOTA_IP_SALT,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `[config] Missing required environment variables: ${missing.join(', ')}. ` +
      `Some features (scanning, quotas) will not work.`
    );
  }

  cachedConfig = {
    scannerUrl: required.SCANNER_URL ?? '',
    scannerApiKey: required.SCANNER_API_KEY ?? '',
    quotaIpSalt: required.QUOTA_IP_SALT ?? 'legalgen-dev-salt-change-in-production',
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    nextPhase: process.env.NEXT_PHASE,
  };

  return cachedConfig;
}

export function validateConfigForProduction(): void {
  const config = getConfig();
  const errors: string[] = [];

  if (config.nodeEnv === 'production') {
    if (!config.scannerUrl) errors.push('SCANNER_URL is required in production');
    if (!config.scannerApiKey) errors.push('SCANNER_API_KEY is required in production');
    if (!config.firebaseServiceAccount) errors.push('FIREBASE_SERVICE_ACCOUNT is required in production');
    if (config.quotaIpSalt === 'legalgen-dev-salt-change-in-production') {
      errors.push('QUOTA_IP_SALT must be changed from default in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
}

export const config = getConfig();