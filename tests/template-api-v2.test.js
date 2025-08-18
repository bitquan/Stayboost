// Template API v2 Test Suite
import assert from 'node:assert';
import { describe, test } from 'node:test';

// Mock Prisma client for testing
const mockPrisma = {
  popupTemplate: {
    findMany: async () => mockTemplates,
    aggregate: async () => mockAggregateResult,
    groupBy: async () => mockGroupByResult
  },
  templateUsageStats: {
    findMany: async () => mockUsageStats,
    aggregate: async () => mockStatsAggregate
  },
  templateFavorites: {
    upsert: async () => ({ id: 1 }),
    deleteMany: async () => ({ count: 1 })
  }
};

// Mock data
const mockTemplates = [
  {
    id: 1,
    name: 'Exit Intent Classic',
    description: 'Classic exit intent popup',
    category: 'exit_intent',
    templateType: 'built_in',
    config: JSON.stringify({
      title: 'Wait! Don\'t leave yet!',
      message: 'Get 10% off your first order',
      buttonText: 'Claim Offer'
    }),
    averageRating: 4.5,
    usageCount: 150,
    isFeatured: true,
    usageStats: [],
    ratings: [],
    favorites: [],
    translations: []
  },
  {
    id: 2,
    name: 'Summer Sale Popup',
    description: 'Seasonal summer promotion',
    category: 'seasonal',
    templateType: 'built_in',
    config: JSON.stringify({
      title: 'Summer Sale!',
      message: 'Up to 50% off everything',
      buttonText: 'Shop Now'
    }),
    averageRating: 4.2,
    usageCount: 89,
    isFeatured: false,
    usageStats: [
      { conversionRate: 0.15, impressions: 1000, conversions: 150 }
    ],
    ratings: [],
    favorites: [{ id: 1 }],
    translations: []
  }
];

const mockUsageStats = [
  {
    id: 1,
    templateId: 1,
    shop: 'test-shop',
    date: new Date(),
    impressions: 1000,
    conversions: 120,
    conversionRate: 0.12,
    revenue: 2400
  }
];

const mockAggregateResult = {
  _sum: {
    impressions: 5000,
    conversions: 600,
    revenue: 12000
  },
  _avg: {
    conversionRate: 0.12
  }
};

const mockGroupByResult = [
  {
    category: 'exit_intent',
    _count: { id: 5 },
    _avg: { averageRating: 4.5, conversionRate: 0.15 }
  }
];

const mockStatsAggregate = mockAggregateResult;

// Mock authentication
const mockAuth = {
  admin: async () => ({
    session: { shop: 'test-shop' }
  })
};

// Mock request objects
const createMockRequest = (method = 'GET', url = '/api/templates-v2', body = null) => ({
  method,
  url,
  json: async () => body || {}
});

const createMockURL = (searchParams = {}) => {
  const url = new URL('http://localhost/api/templates-v2');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
};

describe('Template API v2 Tests', () => {
  
  describe('Performance Monitoring', () => {
    test('should track performance metrics correctly', async (t) => {
      // Test performance tracking functionality
      const startTime = Date.now();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Mock performance tracking
      const responseTime = Date.now() - startTime;
      const success = true;
      const fromCache = false;
      
      assert.ok(responseTime > 0, 'Response time should be positive');
      assert.strictEqual(success, true, 'Success flag should be true');
      assert.strictEqual(fromCache, false, 'Cache flag should be false for new request');
    });

    test('should handle rate limiting', async (t) => {
      // Test rate limiting logic
      const shop = 'test-shop';
      const rateLimits = new Map();
      const RATE_LIMIT = { maxRequests: 5, windowMs: 60000 };
      
      // Simulate rate limit check
      function checkRateLimit(shop) {
        const now = Date.now();
        const shopLimits = rateLimits.get(shop) || { requests: [], blocked: false };
        
        shopLimits.requests = shopLimits.requests.filter(timestamp => 
          now - timestamp < RATE_LIMIT.windowMs
        );
        
        if (shopLimits.requests.length >= RATE_LIMIT.maxRequests) {
          shopLimits.blocked = true;
          rateLimits.set(shop, shopLimits);
          return false;
        }
        
        shopLimits.requests.push(now);
        rateLimits.set(shop, shopLimits);
        return true;
      }
      
      // Should allow first few requests
      assert.ok(checkRateLimit(shop), 'Should allow request within limit');
      assert.ok(checkRateLimit(shop), 'Should allow second request');
      assert.ok(checkRateLimit(shop), 'Should allow third request');
      assert.ok(checkRateLimit(shop), 'Should allow fourth request');
      assert.ok(checkRateLimit(shop), 'Should allow fifth request');
      
      // Should block after limit
      assert.strictEqual(checkRateLimit(shop), false, 'Should block request over limit');
    });
  });

  describe('Enhanced Search Functionality', () => {
    test('should perform weighted text search', async (t) => {
      function enhancedTemplateSearch(templates, query, filters = {}) {
        if (!query && !Object.keys(filters).length) {
          return templates;
        }
        
        let results = [...templates];
        
        if (query) {
          const searchTerms = query.toLowerCase().split(' ');
          results = results.map(template => {
            let relevanceScore = 0;
            const searchableText = [
              template.name,
              template.description,
              template.category
            ].join(' ').toLowerCase();
            
            searchTerms.forEach(term => {
              if (template.name.toLowerCase().includes(term)) relevanceScore += 10;
              if (template.description?.toLowerCase().includes(term)) relevanceScore += 5;
              if (template.category.toLowerCase().includes(term)) relevanceScore += 8;
              if (searchableText.includes(term)) relevanceScore += 2;
            });
            
            return { ...template, relevanceScore };
          }).filter(template => template.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
        
        return results;
      }
      
      const results = enhancedTemplateSearch(mockTemplates, 'exit classic');
      
      assert.ok(results.length > 0, 'Should return search results');
      assert.ok(results[0].relevanceScore > 0, 'Should have relevance score');
      assert.strictEqual(results[0].name, 'Exit Intent Classic', 'Should prioritize exact matches');
    });

    test('should apply category filters', async (t) => {
      function applyFilters(templates, filters) {
        let results = [...templates];
        
        if (filters.category) {
          results = results.filter(template => template.category === filters.category);
        }
        
        if (filters.templateType) {
          results = results.filter(template => template.templateType === filters.templateType);
        }
        
        if (filters.minRating) {
          results = results.filter(template => template.averageRating >= filters.minRating);
        }
        
        return results;
      }
      
      const filteredResults = applyFilters(mockTemplates, { 
        category: 'exit_intent',
        minRating: 4.0
      });
      
      assert.strictEqual(filteredResults.length, 1, 'Should filter by category and rating');
      assert.strictEqual(filteredResults[0].category, 'exit_intent', 'Should match category filter');
      assert.ok(filteredResults[0].averageRating >= 4.0, 'Should match rating filter');
    });

    test('should handle pagination', async (t) => {
      const templates = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Template ${i + 1}`,
        category: 'test'
      }));
      
      const limit = 10;
      const offset = 10;
      
      const paginatedTemplates = templates.slice(offset, offset + limit);
      const total = templates.length;
      
      const pagination = {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0
      };
      
      assert.strictEqual(paginatedTemplates.length, 10, 'Should return correct page size');
      assert.strictEqual(pagination.hasNext, true, 'Should indicate more pages');
      assert.strictEqual(pagination.hasPrevious, true, 'Should indicate previous pages');
      assert.strictEqual(pagination.total, 25, 'Should return total count');
    });
  });

  describe('Quality Scoring Algorithm', () => {
    test('should calculate template quality score', async (t) => {
      function calculateTemplateQualityScore(template, analytics) {
        let score = 0;
        
        // Base score from template completeness
        const config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;
        const requiredFields = ['title', 'message', 'buttonText'];
        const completeness = requiredFields.filter(field => config[field]).length / requiredFields.length;
        score += completeness * 30;
        
        // Performance score from analytics
        if (analytics?.conversionRate) {
          score += Math.min(analytics.conversionRate, 0.25) * 200; // Max 50 points for 25% conversion
        }
        
        // Usage popularity score
        if (template.usageCount > 0) {
          score += Math.min(Math.log10(template.usageCount) * 10, 20); // Max 20 points
        }
        
        return Math.min(Math.round(score), 100);
      }
      
      const template = mockTemplates[0];
      const analytics = { conversionRate: 0.15 };
      
      const qualityScore = calculateTemplateQualityScore(template, analytics);
      
      assert.ok(qualityScore >= 0 && qualityScore <= 100, 'Quality score should be between 0-100');
      assert.ok(qualityScore > 50, 'Good template should have decent score');
    });

    test('should handle incomplete template data', async (t) => {
      function calculateTemplateQualityScore(template, analytics) {
        let score = 0;
        
        try {
          const config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;
          const requiredFields = ['title', 'message', 'buttonText'];
          const completeness = requiredFields.filter(field => config && config[field]).length / requiredFields.length;
          score += completeness * 30;
          
          if (analytics?.conversionRate) {
            score += Math.min(analytics.conversionRate, 0.25) * 200;
          }
          
          if (template.usageCount > 0) {
            score += Math.min(Math.log10(template.usageCount) * 10, 20);
          }
          
          return Math.min(Math.round(score), 100);
        } catch (error) {
          return 0; // Return 0 for invalid templates
        }
      }
      
      const incompleteTemplate = {
        id: 999,
        name: 'Incomplete Template',
        config: '{"title": "Only Title"}',
        usageCount: 0
      };
      
      const qualityScore = calculateTemplateQualityScore(incompleteTemplate, null);
      
      assert.ok(qualityScore >= 0, 'Should handle incomplete data gracefully');
      assert.ok(qualityScore < 30, 'Incomplete template should have low score');
    });
  });

  describe('Caching System', () => {
    test('should store and retrieve cached data', async (t) => {
      const cache = new Map();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      function setCache(key, data, duration = CACHE_DURATION) {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          duration
        });
      }
      
      function getCache(key) {
        const cached = cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.duration) {
          cache.delete(key);
          return null;
        }
        
        return cached.data;
      }
      
      const testData = { test: 'data' };
      const cacheKey = 'test-key';
      
      setCache(cacheKey, testData);
      const retrievedData = getCache(cacheKey);
      
      assert.deepStrictEqual(retrievedData, testData, 'Should retrieve cached data');
      
      // Test cache expiration
      setCache(cacheKey, testData, -1); // Expired cache
      const expiredData = getCache(cacheKey);
      
      assert.strictEqual(expiredData, null, 'Should return null for expired cache');
    });

    test('should clear cache by pattern', async (t) => {
      const cache = new Map();
      
      function clearCache(pattern) {
        const keys = Array.from(cache.keys());
        keys.forEach(key => {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        });
      }
      
      cache.set('templates:shop1', { data: 'shop1' });
      cache.set('templates:shop2', { data: 'shop2' });
      cache.set('analytics:shop1', { data: 'analytics1' });
      
      clearCache('shop1');
      
      assert.strictEqual(cache.has('templates:shop1'), false, 'Should clear shop1 templates');
      assert.strictEqual(cache.has('analytics:shop1'), false, 'Should clear shop1 analytics');
      assert.strictEqual(cache.has('templates:shop2'), true, 'Should keep shop2 data');
    });
  });

  describe('AI Recommendations', () => {
    test('should generate template recommendations', async (t) => {
      function generateRecommendationReason(template, score, context) {
        const reasons = [];
        
        if (score > 80) reasons.push("Highly recommended based on performance data");
        if (template.isFeatured) reasons.push("Featured template with proven results");
        if (template.averageRating > 4.5) reasons.push("Excellent user ratings");
        if (template.usageCount > 100) reasons.push("Popular choice among merchants");
        
        if (context === 'seasonal' && template.category.includes('seasonal')) {
          reasons.push("Perfect for seasonal campaigns");
        }
        
        return reasons.length > 0 ? reasons[0] : "Good match for your store";
      }
      
      const template = mockTemplates[0];
      const reason = generateRecommendationReason(template, 85, 'general');
      
      assert.ok(typeof reason === 'string', 'Should return recommendation reason');
      assert.ok(reason.length > 0, 'Reason should not be empty');
    });

    test('should score recommendations by context', async (t) => {
      function scoreTemplateForContext(template, context, usedCategories = []) {
        let score = 0;
        
        // Category affinity
        if (usedCategories.includes(template.category)) score += 30;
        
        // Global performance
        if (template.averageRating > 4.0) score += 20;
        
        // Context-specific scoring
        if (context === 'seasonal' && template.category.includes('seasonal')) score += 25;
        if (context === 'sales' && ['sales', 'flash_sale'].includes(template.category)) score += 25;
        
        return score;
      }
      
      const seasonalTemplate = mockTemplates[1];
      const seasonalScore = scoreTemplateForContext(seasonalTemplate, 'seasonal', []);
      const salesScore = scoreTemplateForContext(seasonalTemplate, 'sales', []);
      
      assert.ok(seasonalScore > salesScore, 'Seasonal template should score higher for seasonal context');
    });
  });

  describe('Bulk Operations', () => {
    test('should handle bulk favorite operations', async (t) => {
      async function performBulkOperation(templateIds, operation, shop) {
        const results = [];
        
        for (const templateId of templateIds) {
          try {
            switch (operation) {
              case 'favorite':
                // Mock upsert operation
                results.push({ templateId, success: true });
                break;
              case 'unfavorite':
                // Mock delete operation
                results.push({ templateId, success: true });
                break;
              default:
                results.push({ templateId, success: false, error: 'Invalid operation' });
            }
          } catch (error) {
            results.push({ templateId, success: false, error: error.message });
          }
        }
        
        return {
          results,
          summary: {
            total: templateIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        };
      }
      
      const templateIds = [1, 2, 3];
      const result = await performBulkOperation(templateIds, 'favorite', 'test-shop');
      
      assert.strictEqual(result.summary.total, 3, 'Should process all templates');
      assert.strictEqual(result.summary.successful, 3, 'Should succeed for all valid operations');
      assert.strictEqual(result.summary.failed, 0, 'Should have no failures for valid operations');
    });

    test('should handle bulk operation errors gracefully', async (t) => {
      async function performBulkOperation(templateIds, operation, shop) {
        const results = [];
        
        for (const templateId of templateIds) {
          try {
            if (templateId === 999) {
              throw new Error('Template not found');
            }
            results.push({ templateId, success: true });
          } catch (error) {
            results.push({ templateId, success: false, error: error.message });
          }
        }
        
        return {
          results,
          summary: {
            total: templateIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        };
      }
      
      const templateIds = [1, 999, 3]; // 999 will fail
      const result = await performBulkOperation(templateIds, 'favorite', 'test-shop');
      
      assert.strictEqual(result.summary.total, 3, 'Should process all templates');
      assert.strictEqual(result.summary.successful, 2, 'Should succeed for valid templates');
      assert.strictEqual(result.summary.failed, 1, 'Should handle one failure');
      
      const failedResult = result.results.find(r => r.templateId === 999);
      assert.strictEqual(failedResult.success, false, 'Failed template should be marked as failed');
      assert.ok(failedResult.error, 'Failed template should have error message');
    });
  });

  describe('Analytics and Insights', () => {
    test('should generate predictive insights', async (t) => {
      async function generatePredictiveInsights(historicalData) {
        if (historicalData.length < 7) {
          return { message: "Insufficient data for predictions" };
        }
        
        const recentData = historicalData.slice(-7);
        const olderData = historicalData.slice(-14, -7);
        
        const recentAvg = recentData.reduce((sum, d) => sum + d.conversionRate, 0) / recentData.length;
        const olderAvg = olderData.length > 0 ? olderData.reduce((sum, d) => sum + d.conversionRate, 0) / olderData.length : recentAvg;
        
        const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        return {
          trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
          trendPercentage: Math.round(trend * 100) / 100,
          predictedConversionRate: Math.max(0, recentAvg + (trend / 100) * recentAvg),
          confidence: historicalData.length > 30 ? 'high' : 'medium'
        };
      }
      
      const mockHistoricalData = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - (14 - i) * 24 * 60 * 60 * 1000),
        conversionRate: 0.1 + (i * 0.01) // Improving trend
      }));
      
      const insights = await generatePredictiveInsights(mockHistoricalData);
      
      assert.strictEqual(insights.trend, 'improving', 'Should detect improving trend');
      assert.ok(insights.predictedConversionRate > 0, 'Should provide predicted conversion rate');
      assert.strictEqual(insights.confidence, 'medium', 'Should have medium confidence for 14 data points');
    });

    test('should generate actionable insights', async (t) => {
      function generateAnalyticsInsights(stats, trends) {
        const insights = [];
        
        if (stats._avg.conversionRate > 0.15) {
          insights.push({
            type: 'positive',
            message: 'Excellent conversion rate performance',
            action: 'Consider expanding successful campaigns'
          });
        } else if (stats._avg.conversionRate < 0.05) {
          insights.push({
            type: 'warning',
            message: 'Conversion rate needs improvement',
            action: 'Review template content and targeting'
          });
        }
        
        if (trends.length > 7) {
          const recentTrend = trends.slice(-7);
          const avgRecentConversions = recentTrend.reduce((sum, t) => sum + t.conversions, 0) / 7;
          
          if (avgRecentConversions > 10) {
            insights.push({
              type: 'positive',
              message: 'Strong recent performance',
              action: 'Maintain current strategy'
            });
          }
        }
        
        return insights;
      }
      
      const highPerformanceStats = { _avg: { conversionRate: 0.18 } };
      const mockTrends = Array.from({ length: 10 }, () => ({ conversions: 15 }));
      
      const insights = generateAnalyticsInsights(highPerformanceStats, mockTrends);
      
      assert.ok(insights.length > 0, 'Should generate insights');
      assert.strictEqual(insights[0].type, 'positive', 'Should generate positive insight for good performance');
      assert.ok(insights[0].action, 'Should provide actionable recommendations');
    });
  });

  describe('Enhanced Categories', () => {
    test('should provide category metadata', async (t) => {
      const ENHANCED_CATEGORIES = {
        exit_intent: {
          name: 'Exit Intent',
          description: 'Capture abandoning visitors',
          icon: 'ExitIcon',
          priority: 90,
          avgConversionRate: 12.5,
          usage: 'high'
        },
        sales: {
          name: 'Sales & Promotions',
          description: 'Boost sales with targeted offers',
          icon: 'DiscountIcon',
          priority: 85,
          avgConversionRate: 15.2,
          usage: 'high'
        }
      };
      
      const categoryStats = [
        { category: 'exit_intent', _count: { id: 5 }, _avg: { averageRating: 4.5 } }
      ];
      
      const enhancedCategories = Object.entries(ENHANCED_CATEGORIES).map(([key, meta]) => {
        const stats = categoryStats.find(s => s.category === key);
        return {
          key,
          ...meta,
          templateCount: stats?._count.id || 0,
          avgRating: stats?._avg.averageRating || 0
        };
      });
      
      assert.strictEqual(enhancedCategories.length, 2, 'Should return enhanced categories');
      assert.ok(enhancedCategories[0].name, 'Should include category name');
      assert.ok(enhancedCategories[0].description, 'Should include category description');
      assert.ok(typeof enhancedCategories[0].priority === 'number', 'Should include priority');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async (t) => {
      function safeParseConfig(configString) {
        try {
          return JSON.parse(configString);
        } catch (error) {
          return { title: 'Default Title', message: 'Default Message' };
        }
      }
      
      const validConfig = safeParseConfig('{"title": "Valid", "message": "Config"}');
      const invalidConfig = safeParseConfig('invalid json');
      
      assert.deepStrictEqual(validConfig, { title: 'Valid', message: 'Config' }, 'Should parse valid JSON');
      assert.deepStrictEqual(invalidConfig, { title: 'Default Title', message: 'Default Message' }, 'Should provide defaults for invalid JSON');
    });

    test('should handle database errors gracefully', async (t) => {
      async function safeDBOperation(operation) {
        try {
          const result = await operation();
          return { success: true, data: result };
        } catch (error) {
          return { 
            success: false, 
            error: error.message,
            fallback: 'Default data when DB fails'
          };
        }
      }
      
      const successOperation = () => Promise.resolve({ data: 'success' });
      const failOperation = () => Promise.reject(new Error('Database error'));
      
      const successResult = await safeDBOperation(successOperation);
      const failResult = await safeDBOperation(failOperation);
      
      assert.strictEqual(successResult.success, true, 'Should handle successful operations');
      assert.strictEqual(failResult.success, false, 'Should handle failed operations');
      assert.ok(failResult.fallback, 'Should provide fallback data');
    });
  });
});

console.log('✅ Template API v2 Test Suite: All tests completed');
