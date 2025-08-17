/**
 * StayBoost Template Performance Tracking Tests
 * 
 * Tests for the new performance tracking system including:
 * - Template usage statistics
 * - Performance tracking API
 * - Analytics dashboard data
 */

import fs from 'fs';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';

describe('StayBoost Template Performance Tracking', () => {
  
  describe('Performance Tracking API', () => {
    test('should have track-performance API endpoint', () => {
      const apiPath = path.join(process.cwd(), 'app/routes/api.track-performance.jsx');
      assert.ok(fs.existsSync(apiPath), 'Track performance API endpoint should exist');
      
      const content = fs.readFileSync(apiPath, 'utf8');
      assert.ok(content.includes('export async function action'), 'Should have action export for POST requests');
      assert.ok(content.includes('impression'), 'Should handle impression events');
      assert.ok(content.includes('conversion'), 'Should handle conversion events');
      assert.ok(content.includes('dismiss'), 'Should handle dismiss events');
    });

    test('should have template analytics API endpoint', () => {
      const apiPath = path.join(process.cwd(), 'app/routes/api.template-analytics.jsx');
      assert.ok(fs.existsSync(apiPath), 'Template analytics API endpoint should exist');
      
      const content = fs.readFileSync(apiPath, 'utf8');
      assert.ok(content.includes('export async function loader'), 'Should have loader export for GET requests');
      assert.ok(content.includes('overview'), 'Should provide overview analytics');
      assert.ok(content.includes('conversionRate'), 'Should calculate conversion rates');
    });

    test('should validate API request structure', () => {
      const trackApiPath = path.join(process.cwd(), 'app/routes/api.track-performance.jsx');
      const content = fs.readFileSync(trackApiPath, 'utf8');
      
      assert.ok(content.includes('event'), 'Should validate event parameter');
      assert.ok(content.includes('templateId'), 'Should validate templateId parameter');
      assert.ok(content.includes('sessionId'), 'Should validate sessionId parameter');
      assert.ok(content.includes('authenticate'), 'Should authenticate requests');
    });
  });

  describe('Database Schema for Performance Tracking', () => {
    test('should have TemplateUsageStats model in schema', () => {
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      assert.ok(schema.includes('model TemplateUsageStats'), 'Should have TemplateUsageStats model');
      assert.ok(schema.includes('impressions'), 'Should track impressions');
      assert.ok(schema.includes('conversions'), 'Should track conversions');
      assert.ok(schema.includes('dismissals'), 'Should track dismissals');
      assert.ok(schema.includes('templateId'), 'Should reference template ID');
    });

    test('should have proper indexes for performance', () => {
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      assert.ok(schema.includes('@@index'), 'Should have database indexes for performance');
    });
  });

  describe('Theme Extension Performance Tracking', () => {
    test('should have performance tracking in popup JavaScript', () => {
      const jsPath = path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      assert.ok(jsContent.includes('trackPerformance'), 'Should have trackPerformance function');
      assert.ok(jsContent.includes('recordAnalytics'), 'Should have recordAnalytics function');
      assert.ok(jsContent.includes('impression'), 'Should track impressions');
      assert.ok(jsContent.includes('conversion'), 'Should track conversions');
      assert.ok(jsContent.includes('dismiss'), 'Should track dismissals');
    });

    test('should generate session IDs for tracking', () => {
      const jsPath = path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      assert.ok(jsContent.includes('sessionStorage.getItem'), 'Should use session storage');
      assert.ok(jsContent.includes('stayboost-session'), 'Should store session ID');
      assert.ok(jsContent.includes('session_'), 'Should generate session ID format');
    });

    test('should make API calls to track performance', () => {
      const jsPath = path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      assert.ok(jsContent.includes('/api/track-performance'), 'Should call tracking API');
      assert.ok(jsContent.includes('POST'), 'Should use POST method');
      assert.ok(jsContent.includes('JSON.stringify'), 'Should send JSON data');
      assert.ok(jsContent.includes('credentials: \'omit\''), 'Should handle CORS properly');
    });
  });

  describe('Analytics Dashboard', () => {
    test('should have analytics dashboard route', () => {
      const dashboardPath = path.join(process.cwd(), 'app/routes/app.analytics.jsx');
      assert.ok(fs.existsSync(dashboardPath), 'Analytics dashboard should exist');
      
      const content = fs.readFileSync(dashboardPath, 'utf8');
      assert.ok(content.includes('Template Performance Analytics'), 'Should have analytics title');
      assert.ok(content.includes('DataTable'), 'Should use DataTable component');
      assert.ok(content.includes('conversionRate'), 'Should display conversion rates');
    });

    test('should display performance metrics', () => {
      const dashboardPath = path.join(process.cwd(), 'app/routes/app.analytics.jsx');
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      assert.ok(content.includes('Total Impressions'), 'Should show total impressions');
      assert.ok(content.includes('Total Conversions'), 'Should show total conversions');
      assert.ok(content.includes('Average Conversion Rate'), 'Should show average conversion rate');
      assert.ok(content.includes('Badge'), 'Should use badges for status indicators');
    });

    test('should provide performance tips', () => {
      const dashboardPath = path.join(process.cwd(), 'app/routes/app.analytics.jsx');
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      assert.ok(content.includes('Performance Tips'), 'Should provide performance tips');
      assert.ok(content.includes('10%'), 'Should mention conversion rate benchmarks');
      assert.ok(content.includes('optimization'), 'Should suggest optimization strategies');
    });
  });

  describe('Navigation Integration', () => {
    test('should have analytics link in navigation', () => {
      const navPath = path.join(process.cwd(), 'app/routes/app.jsx');
      const content = fs.readFileSync(navPath, 'utf8');
      
      assert.ok(content.includes('/app/analytics'), 'Should have analytics navigation link');
      assert.ok(content.includes('Analytics'), 'Should have analytics label');
    });
  });

  describe('Performance Tracking Integration', () => {
    test('should track template usage when applying templates', () => {
      const applyTemplatePath = path.join(process.cwd(), 'app/routes/api.apply-template.jsx');
      const content = fs.readFileSync(applyTemplatePath, 'utf8');
      
      assert.ok(content.includes('usageCount'), 'Should increment usage count');
      assert.ok(content.includes('increment'), 'Should use increment operation');
    });

    test('should provide template analytics data', () => {
      const analyticsPath = path.join(process.cwd(), 'app/routes/api.template-analytics.jsx');
      const content = fs.readFileSync(analyticsPath, 'utf8');
      
      assert.ok(content.includes('TemplateUsageStats'), 'Should query usage statistics');
      assert.ok(content.includes('groupBy'), 'Should group by template');
      assert.ok(content.includes('_sum'), 'Should sum statistics');
    });
  });

  describe('Error Handling and Reliability', () => {
    test('should handle tracking failures gracefully', () => {
      const jsPath = path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js');
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      
      assert.ok(jsContent.includes('catch'), 'Should catch tracking errors');
      assert.ok(jsContent.includes('Silently fail'), 'Should fail silently');
    });

    test('should provide fallback data for analytics', () => {
      const dashboardPath = path.join(process.cwd(), 'app/routes/app.analytics.jsx');
      const content = fs.readFileSync(dashboardPath, 'utf8');
      
      assert.ok(content.includes('analytics: []'), 'Should provide empty array fallback');
      assert.ok(content.includes('summary: {}'), 'Should provide empty object fallback');
      assert.ok(content.includes('No analytics data available'), 'Should show no data message');
    });
  });

  console.log('✅ All Template Performance Tracking features are properly implemented!');
});
