/**
 * Application startup validation.
 * Runs once on server startup to validate configuration.
 */

let validated = false;

export function validateStartupConfig(): void {
  if (validated) return;
  validated = true;

  // Skip during build phase (static generation)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[startup] Skipping config validation during build phase');
    return;
  }

  const { config } = require('@/lib/config');
  const cfg = config();

  console.log('[startup] Validating configuration...');
  console.log(`[startup] Environment: ${cfg.nodeEnv}`);
  console.log(`[startup] Scanner URL: ${cfg.scannerUrl || 'NOT SET'}`);
  console.log(`[startup] Scanner API Key: ${cfg.scannerApiKey ? 'SET' : 'NOT SET'}`);
  console.log(`[startup] Firebase: ${cfg.firebaseServiceAccount ? 'CONFIGURED' : 'NOT CONFIGURED (using local fallback)'}`);
  console.log(`[startup] Quota Salt: ${cfg.quotaIpSalt === 'legalgen-dev-salt-change-in-production' ? 'DEFAULT (change in production!)' : 'CUSTOM'}`);

  if (cfg.nodeEnv === 'production') {
    try {
      require('@/lib/config').validateConfigForProduction();
      console.log('[startup] Production config validation passed');
    } catch (error) {
      console.error('[startup] Production config validation FAILED:', error);
      throw error;
    }
  }

  console.log('[startup] Configuration validation complete');
}

// Auto-run on import in server runtime (not during build)
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  validateStartupConfig();
}