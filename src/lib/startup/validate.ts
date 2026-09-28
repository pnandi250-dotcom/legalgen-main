/**
 * Startup configuration validation utilities.
 * Called from instrumentation.ts on server startup.
 */

export function validateStartupConfig(): void {
  // Dynamic import to avoid issues with ES modules
  const { config, validateConfigForProduction } = require('@/lib/config');
  const cfg = config;

  console.log('[startup] Validating configuration...');
  console.log(`[startup] Environment: ${cfg.nodeEnv}`);
  console.log(`[startup] Scanner URL: ${cfg.scannerUrl || 'NOT SET'}`);
  console.log(`[startup] Scanner API Key: ${cfg.scannerApiKey ? 'SET' : 'NOT SET'}`);
  console.log(`[startup] Firebase: ${cfg.firebaseServiceAccount ? 'CONFIGURED' : 'NOT CONFIGURED (using local fallback)'}`);
  console.log(`[startup] Quota Salt: ${cfg.quotaIpSalt === 'legalgen-dev-salt-change-in-production' ? 'DEFAULT (change in production!)' : 'CUSTOM'}`);

  if (cfg.nodeEnv === 'production') {
    const result = validateConfigForProduction();
    if (!result.valid) {
      console.warn('[startup] Production config validation warnings:', result.errors.join(', '));
      // Don't throw - log warnings only, don't crash the app
    } else {
      console.log('[startup] Production config validation passed');
    }
  }

  console.log('[startup] Configuration validation complete');
}