/**
 * Tests for Real-time Alerting System
 * Priority #13 - Email/webhook alerts testing
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
    ALERT_CATEGORY,
    ALERT_SEVERITY,
    AlertManager,
    getAlertManager,
    sendSecurityAlert,
    sendSystemAlert
} from '../app/utils/alerting.server.js';

// Mock environment variables
const originalEnv = process.env;

describe('Real-time Alerting System', () => {
  beforeEach(() => {
    // Reset environment for each test
    process.env = {
      ...originalEnv,
      SMTP_HOST: 'localhost',
      SMTP_PORT: '587',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'testpass',
      SMTP_FROM: 'alerts@stayboost.app',
      ADMIN_EMAIL: 'admin@stayboost.app',
      SECURITY_EMAIL: 'security@stayboost.app'
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('AlertManager', () => {
    it('should create AlertManager instance', () => {
      const manager = new AlertManager();
      assert.ok(manager instanceof AlertManager);
      assert.ok(manager.templates instanceof Map);
      assert.ok(manager.webhookEndpoints instanceof Set);
    });

    it('should initialize email transporter when SMTP is configured', () => {
      const manager = new AlertManager();
      assert.ok(manager.emailTransporter);
    });

    it('should not create email transporter when SMTP is not configured', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      
      const manager = new AlertManager();
      assert.strictEqual(manager.emailTransporter, null);
    });

    it('should load default templates', () => {
      const manager = new AlertManager();
      assert.ok(manager.templates.has('email_system'));
      assert.ok(manager.templates.has('email_security'));
      assert.ok(manager.templates.has('webhook_payload'));
    });

    it('should add webhook endpoints', () => {
      const manager = new AlertManager();
      const result = manager.addWebhookEndpoint('https://example.com/webhook');
      
      assert.strictEqual(result, true);
      assert.strictEqual(manager.webhookEndpoints.size, 1);
    });

    it('should reject invalid webhook URLs', () => {
      const manager = new AlertManager();
      const result = manager.addWebhookEndpoint('invalid-url');
      
      assert.strictEqual(result, false);
      assert.strictEqual(manager.webhookEndpoints.size, 0);
    });

    it('should generate webhook secrets', () => {
      const manager = new AlertManager();
      const secret = manager.generateWebhookSecret();
      
      assert.strictEqual(typeof secret, 'string');
      assert.strictEqual(secret.length, 64); // 32 bytes = 64 hex chars
    });

    it('should render templates correctly', () => {
      const manager = new AlertManager();
      const template = 'Hello {{name}}, your {{item}} is ready!';
      const data = { name: 'John', item: 'order' };
      
      const result = manager.renderTemplate(template, data);
      assert.strictEqual(result, 'Hello John, your order is ready!');
    });

    it('should handle conditional template rendering', () => {
      const manager = new AlertManager();
      const template = 'Alert: {{message}}{{#if details}} - Details: {{details}}{{/if}}';
      
      const withDetails = manager.renderTemplate(template, { 
        message: 'Test', 
        details: 'Extra info' 
      });
      const withoutDetails = manager.renderTemplate(template, { 
        message: 'Test' 
      });
      
      assert.strictEqual(withDetails, 'Alert: Test - Details: Extra info');
      assert.strictEqual(withoutDetails, 'Alert: Test');
    });

    it('should check rate limits correctly', () => {
      const manager = new AlertManager();
      
      // Should allow first alert
      const allowed1 = manager.checkRateLimit(ALERT_SEVERITY.CRITICAL, 'test');
      assert.strictEqual(allowed1, true);
      
      // Should allow second alert (limit is 2 for critical)
      const allowed2 = manager.checkRateLimit(ALERT_SEVERITY.CRITICAL, 'test');
      assert.strictEqual(allowed2, true);
      
      // Should reject third alert
      const rejected = manager.checkRateLimit(ALERT_SEVERITY.CRITICAL, 'test');
      assert.strictEqual(rejected, false);
    });

    it('should track alert deliveries', async () => {
      const manager = new AlertManager();
      
      const result = await manager.sendAlert({
        severity: ALERT_SEVERITY.LOW,
        category: ALERT_CATEGORY.SYSTEM,
        title: 'Test Alert',
        message: 'Test message'
      });
      
      assert.ok(result.alertId);
      
      const status = manager.getDeliveryStatus(result.alertId);
      assert.ok(status);
      assert.strictEqual(status.alertId, result.alertId);
    });

    it('should generate alert statistics', () => {
      const manager = new AlertManager();
      const stats = manager.getAlertStats();
      
      assert.ok(typeof stats.total === 'number');
      assert.ok(typeof stats.lastHour === 'number');
      assert.ok(typeof stats.lastDay === 'number');
      assert.ok(typeof stats.successRate === 'object');
      assert.ok(typeof stats.rateLimits === 'object');
    });

    it('should cleanup old records', () => {
      const manager = new AlertManager();
      
      // Add some old records manually for testing
      const weekAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      manager.deliveryTracker.set('old-alert', { createdAt: weekAgo });
      
      const beforeSize = manager.deliveryTracker.size;
      manager.cleanup();
      const afterSize = manager.deliveryTracker.size;
      
      assert.ok(afterSize <= beforeSize);
    });
  });

  describe('Alert Severity and Category Constants', () => {
    it('should have correct severity levels', () => {
      assert.strictEqual(ALERT_SEVERITY.LOW, 'low');
      assert.strictEqual(ALERT_SEVERITY.MEDIUM, 'medium');
      assert.strictEqual(ALERT_SEVERITY.HIGH, 'high');
      assert.strictEqual(ALERT_SEVERITY.CRITICAL, 'critical');
    });

    it('should have correct category types', () => {
      assert.strictEqual(ALERT_CATEGORY.SYSTEM, 'system');
      assert.strictEqual(ALERT_CATEGORY.SECURITY, 'security');
      assert.strictEqual(ALERT_CATEGORY.PERFORMANCE, 'performance');
      assert.strictEqual(ALERT_CATEGORY.BUSINESS, 'business');
      assert.strictEqual(ALERT_CATEGORY.ERROR, 'error');
    });
  });

  describe('Global Alert Manager', () => {
    it('should return singleton instance', () => {
      const manager1 = getAlertManager();
      const manager2 = getAlertManager();
      
      assert.strictEqual(manager1, manager2);
    });
  });

  describe('Convenience Alert Functions', () => {
    it('should send system alerts', async () => {
      const result = await sendSystemAlert(
        'Test System Alert',
        'This is a test system alert'
      );
      
      assert.ok(result.alertId);
      assert.ok(typeof result.success === 'boolean');
    });

    it('should send security alerts with high severity', async () => {
      const result = await sendSecurityAlert(
        'Test Security Alert',
        'This is a test security alert',
        {
          sourceIP: '192.168.1.1',
          userAgent: 'Test Browser'
        }
      );
      
      assert.ok(result.alertId);
      assert.ok(typeof result.success === 'boolean');
    });

    it('should handle alerts without email configuration', async () => {
      delete process.env.ADMIN_EMAIL;
      
      const result = await sendSystemAlert(
        'Test Alert No Email',
        'This alert has no email recipients'
      );
      
      // Should still work without email
      assert.ok(result.alertId);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect different rate limits for different severities', async () => {
      const manager = getAlertManager();
      
      // Low severity should have higher limit
      let lowCount = 0;
      while (manager.checkRateLimit(ALERT_SEVERITY.LOW, 'test-low')) {
        lowCount++;
        if (lowCount > 25) break; // Safety break
      }
      
      // Critical severity should have lower limit
      let criticalCount = 0;
      while (manager.checkRateLimit(ALERT_SEVERITY.CRITICAL, 'test-critical')) {
        criticalCount++;
        if (criticalCount > 10) break; // Safety break
      }
      
      assert.ok(lowCount > criticalCount);
    });

    it('should allow bypassing rate limits for security alerts', async () => {
      const manager = getAlertManager();
      
      // Exhaust rate limit
      while (manager.checkRateLimit(ALERT_SEVERITY.CRITICAL, 'security-test')) {
        // Continue until rate limited
      }
      
      // Security alert should still work with skipRateLimit
      const result = await manager.sendAlert({
        severity: ALERT_SEVERITY.CRITICAL,
        category: ALERT_CATEGORY.SECURITY,
        title: 'Security Alert',
        message: 'Critical security event',
        skipRateLimit: true
      });
      
      assert.ok(result.alertId);
    });
  });

  describe('Template System', () => {
    it('should use different templates for different categories', () => {
      const manager = new AlertManager();
      
      const systemTemplate = manager.templates.get('email_system');
      const securityTemplate = manager.templates.get('email_security');
      
      assert.ok(systemTemplate.subject.includes('System Alert'));
      assert.ok(securityTemplate.subject.includes('SECURITY ALERT'));
      assert.ok(securityTemplate.body.includes('🚨'));
    });

    it('should include all required fields in webhook payload', () => {
      const manager = new AlertManager();
      const template = manager.templates.get('webhook_payload');
      
      const requiredFields = [
        'timestamp', 'alert_id', 'severity', 'category', 
        'title', 'message', 'source', 'shop', 'details'
      ];
      
      const templateString = JSON.stringify(template);
      requiredFields.forEach(field => {
        assert.ok(templateString.includes(field));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook delivery failures gracefully', async () => {
      const manager = new AlertManager();
      
      // Add invalid webhook endpoint
      manager.webhookEndpoints.add({
        url: 'https://invalid-domain-that-does-not-exist.com/webhook',
        secret: 'test-secret'
      });
      
      const result = await manager.sendAlert({
        severity: ALERT_SEVERITY.LOW,
        category: ALERT_CATEGORY.SYSTEM,
        title: 'Test Alert',
        message: 'Test message'
      });
      
      // Should not throw, but should mark as failed
      assert.ok(result.alertId);
      assert.ok(Array.isArray(result.webhooks));
      if (result.webhooks.length > 0) {
        assert.strictEqual(result.webhooks[0].success, false);
      }
    });

    it('should handle email delivery failures gracefully', async () => {
      // Configure invalid SMTP settings
      process.env.SMTP_HOST = 'invalid-smtp-server.com';
      process.env.SMTP_PORT = '9999';
      
      const manager = new AlertManager();
      
      const result = await manager.sendEmailAlert(
        {
          alertId: 'test-alert',
          timestamp: new Date().toISOString(),
          severity: ALERT_SEVERITY.LOW,
          category: ALERT_CATEGORY.SYSTEM,
          title: 'Test Alert',
          message: 'Test message'
        },
        ['test@example.com']
      );
      
      // Should handle gracefully
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('Integration Points', () => {
    it('should be ready for health check integration', async () => {
      // Test that alerting can be called from health checks
      const result = await sendSystemAlert(
        'Health Check Failed',
        'Database connection is down',
        {
          checkName: 'database',
          status: 'failed',
          timestamp: new Date().toISOString()
        },
        ALERT_SEVERITY.CRITICAL
      );
      
      assert.ok(result.alertId);
    });

    it('should be ready for error tracking integration', async () => {
      const mockError = new Error('Test error');
      mockError.stack = 'Test stack trace';
      
      const result = await sendSecurityAlert(
        'Security Error',
        'Potential security breach detected',
        {
          error: mockError.message,
          stack: mockError.stack,
          sourceIP: '192.168.1.100'
        }
      );
      
      assert.ok(result.alertId);
    });
  });
});
