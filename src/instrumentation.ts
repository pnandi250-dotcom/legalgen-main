/**
 * Next.js Instrumentation - runs once on server startup.
 * Official place for startup code (logs, config validation, etc.).
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'edge') return;

  // Skip during build phase (static generation)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[instrumentation] Skipping config validation during build phase');
    return;
  }

  // Dynamic import to avoid issues with ES modules
  const { config, validateConfigForProduction } = await import('@/lib/config');
  const cfg = config;

  console.log('[instrumentation] Validating configuration...');
  console.log(`[instrumentation] Environment: ${cfg.nodeEnv}`);
  console.log(`[instrumentation] Scanner URL: ${cfg.scannerUrl || 'NOT SET'}`);
  console.log(`[instrumentation] Scanner API Key: ${cfg.scannerApiKey ? 'SET' : 'NOT SET'}`);
  console.log(`[instrumentation] Firebase: ${cfg.firebaseServiceAccount ? 'CONFIGURED' : 'NOT CONFIGURED (using local fallback)'}`);
  console.log(`[instrumentation] Quota Salt: ${cfg.quotaIpSalt === 'legalgen-dev-salt-change-in-production' ? 'DEFAULT (change in production!)' : 'CUSTOM'}`);

  if (cfg.nodeEnv === 'production') {
    const result = validateConfigForProduction();
    if (!result.valid) {
      console.warn('[instrumentation] Production config validation warnings:', result.errors.join(', '));
      // Don't throw - log warnings only, don't crash the app
    } else {
      console.log('[instrumentation] Production config validation passed');
    }
  }

  console.log('[instrumentation] Configuration validation complete');
}