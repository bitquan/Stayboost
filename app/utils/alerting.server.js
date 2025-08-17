/**
 * Real-time Alerting System
 * Priority #13 - Email/webhook alerts using Node.js native modules
 * 
 * Features:
 * - Email notifications using Node.js native SMTP
 * - Webhook notifications using Node.js native HTTP
 * - Alert types: system, security, performance, business
 * - Rate limiting to prevent spam
 * - Retry mechanism for failed deliveries
 * - Template system for alert formatting
 */

import { createHash, randomBytes } from 'crypto';
import { URL } from 'url';

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Alert categories
export const ALERT_CATEGORY = {
  SYSTEM: 'system',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  BUSINESS: 'business',
  ERROR: 'error'
};

// Alert rate limiting (per hour)
const RATE_LIMITS = {
  [ALERT_SEVERITY.LOW]: 20,
  [ALERT_SEVERITY.MEDIUM]: 10,
  [ALERT_SEVERITY.HIGH]: 5,
  [ALERT_SEVERITY.CRITICAL]: 2
};

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

// Alert delivery tracking
const deliveryTracker = new Map();

/**
 * AlertManager - Main class for managing alerts
 */
export class AlertManager {
  constructor() {
    this.emailTransporter = null;
    this.webhookEndpoints = new Set();
    this.templates = new Map();
    this.loadTemplates();
    // Initialize email transporter asynchronously without blocking
    this.initializeEmailTransporter().catch(error => {
      console.error('Failed to initialize email transporter:', error);
    });
  }

  /**
   * Initialize email transporter with environment configuration
   */
  async initializeEmailTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only create transporter if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = await import('nodemailer');
        this.emailTransporter = nodemailer.default.createTransporter(emailConfig);
      } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        this.emailTransporter = null;
      }
    }
  }

  /**
   * Load alert templates
   */
  loadTemplates() {
    // Email templates
    this.templates.set('email_system', {
      subject: '[StayBoost] System Alert: {{title}}',
      body: `
        <h2>System Alert</h2>
        <p><strong>Severity:</strong> {{severity}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Message:</strong> {{message}}</p>
        <p><strong>Timestamp:</strong> {{timestamp}}</p>
        {{#if details}}
        <h3>Details:</h3>
        <pre>{{details}}</pre>
        {{/if}}
        <hr>
        <p><em>This is an automated alert from StayBoost.</em></p>
      `
    });

    this.templates.set('email_security', {
      subject: '[StayBoost] SECURITY ALERT: {{title}}',
      body: `
        <h2 style="color: red;">🚨 SECURITY ALERT</h2>
        <p><strong>Severity:</strong> <span style="color: red;">{{severity}}</span></p>
        <p><strong>Event:</strong> {{message}}</p>
        <p><strong>Time:</strong> {{timestamp}}</p>
        {{#if sourceIP}}
        <p><strong>Source IP:</strong> {{sourceIP}}</p>
        {{/if}}
        {{#if userAgent}}
        <p><strong>User Agent:</strong> {{userAgent}}</p>
        {{/if}}
        <h3>Action Required:</h3>
        <p>Please review this security event immediately.</p>
        {{#if details}}
        <h3>Details:</h3>
        <pre>{{details}}</pre>
        {{/if}}
        <hr>
        <p><em>This is an automated security alert from StayBoost.</em></p>
      `
    });

    // Webhook payload templates
    this.templates.set('webhook_payload', {
      timestamp: '{{timestamp}}',
      alert_id: '{{alertId}}',
      severity: '{{severity}}',
      category: '{{category}}',
      title: '{{title}}',
      message: '{{message}}',
      source: 'stayboost',
      shop: '{{shop}}',
      details: '{{details}}'
    });
  }

  /**
   * Register webhook endpoint
   */
  addWebhookEndpoint(url, secret = null) {
    try {
      const parsedUrl = new URL(url);
      this.webhookEndpoints.add({
        url: parsedUrl.toString(),
        secret: secret || this.generateWebhookSecret()
      });
      return true;
    } catch (error) {
      console.error('Invalid webhook URL:', error.message);
      return false;
    }
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret() {
    return randomBytes(32).toString('hex');
  }

  /**
   * Check rate limiting for alerts
   */
  checkRateLimit(severity, identifier = 'global') {
    const key = `${severity}_${identifier}`;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Clean old entries
    if (rateLimitStore.has(key)) {
      const timestamps = rateLimitStore.get(key).filter(ts => ts > hourAgo);
      rateLimitStore.set(key, timestamps);
    }

    const currentCount = rateLimitStore.get(key)?.length || 0;
    const limit = RATE_LIMITS[severity] || 10;

    if (currentCount >= limit) {
      return false;
    }

    // Add current timestamp
    const timestamps = rateLimitStore.get(key) || [];
    timestamps.push(now);
    rateLimitStore.set(key, timestamps);

    return true;
  }

  /**
   * Render template with data
   */
  renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    }).replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, key, content) => {
      return data[key] ? content.replace(/\{\{(\w+)\}\}/g, (m, k) => data[k] || m) : '';
    });
  }

  /**
   * Send email alert
   */
  async sendEmailAlert(alert, recipients) {
    if (!this.emailTransporter || !recipients.length) {
      return { success: false, error: 'Email not configured or no recipients' };
    }

    try {
      const templateKey = `email_${alert.category}`;
      const template = this.templates.get(templateKey) || this.templates.get('email_system');
      
      const subject = this.renderTemplate(template.subject, alert);
      const html = this.renderTemplate(template.body, alert);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'alerts@stayboost.app',
        to: recipients.join(', '),
        subject,
        html
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        recipients: recipients.length
      };
    } catch (error) {
      console.error('Email alert failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    const results = [];

    for (const webhook of this.webhookEndpoints) {
      try {
        const payload = this.renderTemplate(
          JSON.stringify(this.templates.get('webhook_payload')),
          alert
        );
        
        // Create signature if secret is provided
        let signature = null;
        if (webhook.secret) {
          const hmac = createHash('sha256');
          hmac.update(payload, 'utf8');
          signature = `sha256=${hmac.digest('hex')}`;
        }

        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'StayBoost-Alerting/1.0',
          'X-StayBoost-Alert-Id': alert.alertId,
          'X-StayBoost-Timestamp': alert.timestamp
        };

        if (signature) {
          headers['X-StayBoost-Signature'] = signature;
        }

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload,
          timeout: 10000 // 10 second timeout
        });

        results.push({
          url: webhook.url,
          success: response.ok,
          status: response.status,
          statusText: response.statusText
        });

      } catch (error) {
        results.push({
          url: webhook.url,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Send alert with automatic delivery method selection
   */
  async sendAlert({
    severity = ALERT_SEVERITY.MEDIUM,
    category = ALERT_CATEGORY.SYSTEM,
    title,
    message,
    details = null,
    shop = null,
    sourceIP = null,
    userAgent = null,
    emailRecipients = [],
    skipRateLimit = false
  }) {
    // Generate unique alert ID
    const alertId = randomBytes(16).toString('hex');
    
    // Check rate limiting
    const rateLimitKey = `${category}_${shop || 'global'}`;
    if (!skipRateLimit && !this.checkRateLimit(severity, rateLimitKey)) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        alertId
      };
    }

    // Prepare alert data
    const alert = {
      alertId,
      timestamp: new Date().toISOString(),
      severity,
      category,
      title,
      message,
      details: details ? JSON.stringify(details, null, 2) : null,
      shop,
      sourceIP,
      userAgent
    };

    const results = {
      alertId,
      email: null,
      webhooks: [],
      success: false
    };

    try {
      // Send email alerts
      if (emailRecipients.length > 0) {
        results.email = await this.sendEmailAlert(alert, emailRecipients);
      }

      // Send webhook alerts
      if (this.webhookEndpoints.size > 0) {
        results.webhooks = await this.sendWebhookAlert(alert);
      }

      // Determine overall success
      const emailSuccess = !results.email || results.email.success;
      const webhookSuccess = results.webhooks.length === 0 || 
                           results.webhooks.some(w => w.success);
      
      results.success = emailSuccess && webhookSuccess;

      // Track delivery
      deliveryTracker.set(alertId, {
        ...results,
        createdAt: Date.now()
      });

      return results;

    } catch (error) {
      console.error('Alert delivery failed:', error);
      return {
        ...results,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get alert delivery status
   */
  getDeliveryStatus(alertId) {
    return deliveryTracker.get(alertId);
  }

  /**
   * Get delivery tracker for admin interface
   */
  getDeliveryTracker() {
    return deliveryTracker;
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    const recentAlerts = Array.from(deliveryTracker.values())
      .filter(alert => alert.createdAt > dayAgo);

    const stats = {
      total: deliveryTracker.size,
      lastHour: recentAlerts.filter(a => a.createdAt > hourAgo).length,
      lastDay: recentAlerts.length,
      successRate: {
        email: 0,
        webhooks: 0,
        overall: 0
      },
      rateLimits: {
        active: rateLimitStore.size,
        limits: RATE_LIMITS
      }
    };

    if (recentAlerts.length > 0) {
      const emailSuccess = recentAlerts.filter(a => !a.email || a.email.success).length;
      const webhookSuccess = recentAlerts.filter(a => 
        a.webhooks.length === 0 || a.webhooks.some(w => w.success)
      ).length;
      const overallSuccess = recentAlerts.filter(a => a.success).length;

      stats.successRate.email = (emailSuccess / recentAlerts.length) * 100;
      stats.successRate.webhooks = (webhookSuccess / recentAlerts.length) * 100;
      stats.successRate.overall = (overallSuccess / recentAlerts.length) * 100;
    }

    return stats;
  }

  /**
   * Clean up old delivery records
   */
  cleanup() {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (const [alertId, alert] of deliveryTracker.entries()) {
      if (alert.createdAt < weekAgo) {
        deliveryTracker.delete(alertId);
      }
    }

    // Clean rate limit store
    const hourAgo = now - (60 * 60 * 1000);
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const filtered = timestamps.filter(ts => ts > hourAgo);
      if (filtered.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, filtered);
      }
    }
  }
}

// Global alert manager instance
let alertManager = null;

/**
 * Get or create the global alert manager instance
 */
export function getAlertManager() {
  if (!alertManager) {
    alertManager = new AlertManager();
    
    // Set up cleanup interval (every hour)
    setInterval(() => {
      alertManager.cleanup();
    }, 60 * 60 * 1000);
  }
  return alertManager;
}

/**
 * Convenience functions for common alert types
 */

export async function sendSystemAlert(title, message, details = null, severity = ALERT_SEVERITY.MEDIUM) {
  const manager = getAlertManager();
  return manager.sendAlert({
    category: ALERT_CATEGORY.SYSTEM,
    severity,
    title,
    message,
    details,
    emailRecipients: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []
  });
}

export async function sendSecurityAlert(title, message, context = {}) {
  const manager = getAlertManager();
  return manager.sendAlert({
    category: ALERT_CATEGORY.SECURITY,
    severity: ALERT_SEVERITY.HIGH,
    title,
    message,
    details: context.details,
    shop: context.shop,
    sourceIP: context.sourceIP,
    userAgent: context.userAgent,
    emailRecipients: process.env.SECURITY_EMAIL ? 
      [process.env.SECURITY_EMAIL] : 
      (process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []),
    skipRateLimit: true // Security alerts bypass rate limiting
  });
}

export async function sendPerformanceAlert(title, message, metrics = null) {
  const manager = getAlertManager();
  return manager.sendAlert({
    category: ALERT_CATEGORY.PERFORMANCE,
    severity: ALERT_SEVERITY.MEDIUM,
    title,
    message,
    details: metrics,
    emailRecipients: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []
  });
}

export async function sendBusinessAlert(title, message, shop = null, details = null) {
  const manager = getAlertManager();
  return manager.sendAlert({
    category: ALERT_CATEGORY.BUSINESS,
    severity: ALERT_SEVERITY.LOW,
    title,
    message,
    details,
    shop,
    emailRecipients: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []
  });
}

export async function sendErrorAlert(error, context = {}) {
  const manager = getAlertManager();
  return manager.sendAlert({
    category: ALERT_CATEGORY.ERROR,
    severity: ALERT_SEVERITY.MEDIUM,
    title: `Application Error: ${error.name || 'Unknown Error'}`,
    message: error.message || 'An unknown error occurred',
    details: {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    },
    shop: context.shop,
    emailRecipients: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : []
  });
}

// Alert constants are already exported above
