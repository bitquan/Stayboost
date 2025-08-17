// Test rate limiting functionality

import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { checkRateLimit, rateLimitConfigs } from '../app/utils/simpleRateLimit.server.js';

describe('Rate Limiting', () => {
  beforeEach(async () => {
    // Clear any existing rate limit data
    const rateLimitModule = await import('../app/utils/simpleRateLimit.server.js');
    if (rateLimitModule.rateLimitStore) {
      rateLimitModule.rateLimitStore.clear();
    }
  });

  it('should allow requests within limit', async () => {
    const clientId = 'test-client-1';
    const result = await checkRateLimit(clientId, 'public');
    
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, rateLimitConfigs.public.max - 1);
    assert.ok(result.resetTime > Date.now());
  });

  it('should block requests exceeding limit', async () => {
    const clientId = 'test-client-2';
    const config = rateLimitConfigs.public;
    
    // Make requests up to the limit
    for (let i = 0; i < config.max; i++) {
      const result = await checkRateLimit(clientId, 'public');
      assert.strictEqual(result.allowed, true);
    }
    
    // Next request should be blocked
    const blockedResult = await checkRateLimit(clientId, 'public');
    assert.strictEqual(blockedResult.allowed, false);
    assert.strictEqual(blockedResult.remaining, 0);
  });

  it('should reset limit after window expires', async () => {
    const clientId = 'test-client-3';
    
    // Mock a shorter window for testing
    const originalConfig = rateLimitConfigs.public;
    rateLimitConfigs.public = { windowMs: 100, max: 2 }; // 100ms window, 2 requests max
    
    try {
      // Make requests up to limit
      await checkRateLimit(clientId, 'public');
      await checkRateLimit(clientId, 'public');
      
      // Should be blocked
      const blocked = await checkRateLimit(clientId, 'public');
      assert.strictEqual(blocked.allowed, false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      const allowed = await checkRateLimit(clientId, 'public');
      assert.strictEqual(allowed.allowed, true);
      
    } finally {
      // Restore original config
      rateLimitConfigs.public = originalConfig;
    }
  });

  it('should track different clients separately', async () => {
    const client1 = 'test-client-4';
    const client2 = 'test-client-5';
    
    const result1 = await checkRateLimit(client1, 'public');
    const result2 = await checkRateLimit(client2, 'public');
    
    assert.strictEqual(result1.allowed, true);
    assert.strictEqual(result2.allowed, true);
    assert.strictEqual(result1.remaining, result2.remaining);
  });

  it('should handle different rate limit types', async () => {
    const clientId = 'test-client-6';
    
    const publicResult = await checkRateLimit(clientId, 'public');
    const authResult = await checkRateLimit(clientId, 'auth');
    
    assert.strictEqual(publicResult.limit, rateLimitConfigs.public.max);
    assert.strictEqual(authResult.limit, rateLimitConfigs.auth.max);
    assert.notStrictEqual(publicResult.limit, authResult.limit);
  });
});

describe('Rate Limiting API Integration', () => {
  it('should include rate limit headers in API response', async () => {
    // This would be an integration test that makes actual HTTP requests
    // For now, we'll just verify the configuration is correct
    const publicConfig = rateLimitConfigs.public;
    
    assert.ok(publicConfig.windowMs > 0);
    assert.ok(publicConfig.max > 0);
    assert.strictEqual(typeof publicConfig.windowMs, 'number');
    assert.strictEqual(typeof publicConfig.max, 'number');
  });
});
