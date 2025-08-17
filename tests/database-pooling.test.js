// Test database connection pooling functionality

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { connectionPoolHealthCheck, getDatabaseMetrics, testDatabaseConnection } from '../app/utils/database.server.js';

describe('Database Connection Pooling', () => {
  it('should connect to database successfully', async () => {
    const result = await testDatabaseConnection();
    
    assert.strictEqual(result.connected, true);
    assert.strictEqual(result.error, null);
  });

  it('should return database metrics', async () => {
    const metrics = await getDatabaseMetrics();
    
    assert.strictEqual(metrics.status, "healthy");
    assert.ok(metrics.connection_time_ms >= 0);
    assert.ok(metrics.timestamp);
    assert.ok(metrics.database_type);
  });

  it('should handle concurrent database queries', async () => {
    const poolHealth = await connectionPoolHealthCheck();
    
    assert.strictEqual(poolHealth.status, "healthy");
    assert.strictEqual(poolHealth.concurrent_queries, 3);
    assert.ok(poolHealth.total_time_ms >= 0);
    assert.ok(poolHealth.average_time_ms >= 0);
    assert.strictEqual(poolHealth.all_queries_successful, true);
  });

  it('should handle database connection timeout', async () => {
    // Test with very short timeout
    const result = await testDatabaseConnection(1); // 1ms timeout
    
    // Should either succeed quickly or timeout
    assert.ok(result.connected === true || result.error?.includes("timeout"));
  });

  it('should have proper connection pool configuration', async () => {
    const metrics = await getDatabaseMetrics();
    
    assert.ok(metrics.pool_info);
    assert.ok(metrics.pool_info.max_connections);
    
    // Verify pool size is appropriate for environment
    const expectedPoolSize = process.env.NODE_ENV === "production" ? 10 : 5;
    assert.strictEqual(metrics.pool_info.max_connections, expectedPoolSize);
  });
});

describe('Database Health Endpoints', () => {
  it('should validate health endpoint structure', async () => {
    // Test the expected response structure
    const metrics = await getDatabaseMetrics();
    const poolHealth = await connectionPoolHealthCheck();
    
    // Verify required fields exist
    assert.ok(metrics.status);
    assert.ok(metrics.timestamp);
    assert.ok(poolHealth.status);
    assert.ok(typeof poolHealth.concurrent_queries === 'number');
  });
});
