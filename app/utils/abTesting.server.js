/**
 * A/B Testing Framework for StayBoost
 * Priority #16 - Split test different popup designs and messages
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add comprehensive unit tests for A/B test logic
 * - [ ] Test statistical significance calculations
 * - [ ] Create integration tests with popup system
 * - [ ] Test traffic allocation algorithms
 * - [ ] Add E2E tests for complete A/B test workflow
 * - [ ] Test variant assignment consistency
 * - [ ] Validate results reporting accuracy
 * - [ ] Test concurrent A/B test handling
 * - [ ] Integration with analytics dashboard
 * - [ ] Test A/B test performance impact
 */

/**
 * A/B Test Configuration
 */
export const AB_TEST_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused'
};

export const AB_TEST_TYPES = {
  POPUP_DESIGN: 'popup_design',
  MESSAGE_CONTENT: 'message_content',
  DISCOUNT_AMOUNT: 'discount_amount',
  TIMING: 'timing',
  TRIGGER_RULES: 'trigger_rules'
};

/**
 * A/B Test Manager
 */
export class ABTestManager {
  constructor(shopId) {
    this.shopId = shopId;
  }

  /**
   * Create a new A/B test
   */
  async createTest({
    name,
    description,
    testType = AB_TEST_TYPES.MESSAGE_CONTENT,
    variants = [],
    trafficSplit = [50, 50],
    duration = 14, // days
    targetMetric = 'conversion_rate',
    minSampleSize = 1000
  }) {
    try {
      // Validate variants
      if (variants.length < 2) {
        throw new Error('A/B test requires at least 2 variants');
      }

      if (trafficSplit.length !== variants.length) {
        throw new Error('Traffic split must match number of variants');
      }

      const totalSplit = trafficSplit.reduce((sum, split) => sum + split, 0);
      if (totalSplit !== 100) {
        throw new Error('Traffic split must total 100%');
      }

      const test = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        shopId: this.shopId,
        name,
        description,
        testType,
        status: AB_TEST_STATUS.DRAFT,
        variants: variants.map((variant, index) => ({
          id: `variant_${index + 1}`,
          name: variant.name || `Variant ${String.fromCharCode(65 + index)}`,
          config: variant.config,
          trafficPercentage: trafficSplit[index],
          metrics: {
            impressions: 0,
            conversions: 0,
            conversionRate: 0,
            revenue: 0
          }
        })),
        settings: {
          duration,
          targetMetric,
          minSampleSize,
          startDate: null,
          endDate: null,
          autoWinner: false,
          significanceThreshold: 0.95
        },
        results: {
          winner: null,
          confidence: 0,
          lift: 0,
          isSignificant: false,
          completedAt: null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store in database (would be implemented with Prisma)
      await this.saveTest(test);

      return test;
    } catch (error) {
      throw new Error(`Failed to create A/B test: ${error.message}`);
    }
  }

  /**
   * Start an A/B test
   */
  async startTest(testId) {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== AB_TEST_STATUS.DRAFT) {
        throw new Error('Only draft tests can be started');
      }

      test.status = AB_TEST_STATUS.ACTIVE;
      test.settings.startDate = new Date().toISOString();
      test.settings.endDate = new Date(
        Date.now() + test.settings.duration * 24 * 60 * 60 * 1000
      ).toISOString();
      test.updatedAt = new Date().toISOString();

      await this.saveTest(test);
      return test;
    } catch (error) {
      throw new Error(`Failed to start test: ${error.message}`);
    }
  }

  /**
   * Get variant for user (with traffic allocation)
   */
  async getVariantForUser(testId, userId) {
    try {
      const test = await this.getTest(testId);
      if (!test || test.status !== AB_TEST_STATUS.ACTIVE) {
        return null;
      }

      // Use userId hash for consistent variant assignment
      const hash = this.hashUserId(userId + testId);
      const bucket = hash % 100;
      
      let cumulativePercentage = 0;
      for (const variant of test.variants) {
        cumulativePercentage += variant.trafficPercentage;
        if (bucket < cumulativePercentage) {
          return variant;
        }
      }

      return test.variants[0]; // Fallback
    } catch (error) {
      console.error('Error getting variant for user:', error);
      return null;
    }
  }

  /**
   * Track impression for variant
   */
  async trackImpression(testId, variantId, userId) {
    try {
      const test = await this.getTest(testId);
      if (!test) return;

      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) return;

      variant.metrics.impressions++;
      test.updatedAt = new Date().toISOString();

      await this.saveTest(test);
      return variant.metrics;
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  /**
   * Track conversion for variant
   */
  async trackConversion(testId, variantId, userId, revenue = 0) {
    try {
      const test = await this.getTest(testId);
      if (!test) return;

      const variant = test.variants.find(v => v.id === variantId);
      if (!variant) return;

      variant.metrics.conversions++;
      variant.metrics.revenue += revenue;
      variant.metrics.conversionRate = variant.metrics.impressions > 0 
        ? (variant.metrics.conversions / variant.metrics.impressions) * 100 
        : 0;

      test.updatedAt = new Date().toISOString();

      // Check if test should be completed
      await this.checkTestCompletion(test);

      await this.saveTest(test);
      return variant.metrics;
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  /**
   * Check if test should be completed based on statistical significance
   */
  async checkTestCompletion(test) {
    try {
      // Check minimum sample size
      const totalImpressions = test.variants.reduce(
        (sum, variant) => sum + variant.metrics.impressions, 
        0
      );

      if (totalImpressions < test.settings.minSampleSize) {
        return false;
      }

      // Check duration
      const now = new Date();
      const endDate = new Date(test.settings.endDate);
      
      if (now < endDate && !test.settings.autoWinner) {
        return false;
      }

      // Calculate statistical significance (simplified)
      const results = this.calculateStatisticalSignificance(test);
      
      if (results.isSignificant || now >= endDate) {
        test.status = AB_TEST_STATUS.COMPLETED;
        test.results = results;
        test.results.completedAt = new Date().toISOString();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking test completion:', error);
      return false;
    }
  }

  /**
   * Calculate statistical significance (simplified implementation)
   */
  calculateStatisticalSignificance(test) {
    try {
      if (test.variants.length !== 2) {
        // Multi-variant tests need more complex analysis
        return {
          winner: null,
          confidence: 0,
          lift: 0,
          isSignificant: false
        };
      }

      const [controlVariant, testVariant] = test.variants;
      
      const controlRate = controlVariant.metrics.conversionRate / 100;
      const testRate = testVariant.metrics.conversionRate / 100;
      
      // Calculate lift
      const lift = controlRate > 0 
        ? ((testRate - controlRate) / controlRate) * 100 
        : 0;

      // Simplified confidence calculation (would use proper statistical tests in production)
      const minSampleSize = 100;
      const hasMinSamples = controlVariant.metrics.impressions >= minSampleSize && 
                           testVariant.metrics.impressions >= minSampleSize;
      
      const rateDifference = Math.abs(testRate - controlRate);
      const confidence = hasMinSamples && rateDifference > 0.01 ? 0.95 : 0.5;
      
      const isSignificant = confidence >= test.settings.significanceThreshold;
      const winner = isSignificant 
        ? (testRate > controlRate ? testVariant.id : controlVariant.id)
        : null;

      return {
        winner,
        confidence,
        lift,
        isSignificant
      };
    } catch (error) {
      console.error('Error calculating statistical significance:', error);
      return {
        winner: null,
        confidence: 0,
        lift: 0,
        isSignificant: false
      };
    }
  }

  /**
   * Get all tests for shop
   */
  async getTests(status = null) {
    try {
      // In production, this would query the database
      const allTests = await this.loadTestsFromStorage();
      
      if (status) {
        return allTests.filter(test => test.status === status);
      }
      
      return allTests;
    } catch (error) {
      console.error('Error getting tests:', error);
      return [];
    }
  }

  /**
   * Get specific test
   */
  async getTest(testId) {
    try {
      const tests = await this.loadTestsFromStorage();
      return tests.find(test => test.id === testId);
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  /**
   * Generate report for test
   */
  async generateTestReport(testId) {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      const totalImpressions = test.variants.reduce(
        (sum, variant) => sum + variant.metrics.impressions, 
        0
      );
      const totalConversions = test.variants.reduce(
        (sum, variant) => sum + variant.metrics.conversions, 
        0
      );
      const totalRevenue = test.variants.reduce(
        (sum, variant) => sum + variant.metrics.revenue, 
        0
      );

      return {
        test: {
          id: test.id,
          name: test.name,
          status: test.status,
          duration: test.settings.duration,
          startDate: test.settings.startDate,
          endDate: test.settings.endDate
        },
        summary: {
          totalImpressions,
          totalConversions,
          totalRevenue,
          overallConversionRate: totalImpressions > 0 
            ? (totalConversions / totalImpressions) * 100 
            : 0
        },
        variants: test.variants.map(variant => ({
          ...variant,
          sampleSize: variant.metrics.impressions,
          significance: test.results.winner === variant.id ? 'Winner' : 'Loser'
        })),
        results: test.results,
        recommendations: this.generateRecommendations(test)
      };
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(test) {
    const recommendations = [];

    if (test.status === AB_TEST_STATUS.COMPLETED) {
      if (test.results.isSignificant) {
        recommendations.push({
          type: 'winner',
          message: `Implement the winning variant (${test.results.winner}) with ${test.results.lift.toFixed(1)}% lift`
        });
      } else {
        recommendations.push({
          type: 'inconclusive',
          message: 'No significant difference found. Consider running test longer or with larger sample size'
        });
      }
    } else {
      const totalSamples = test.variants.reduce(
        (sum, variant) => sum + variant.metrics.impressions, 
        0
      );
      
      if (totalSamples < test.settings.minSampleSize) {
        recommendations.push({
          type: 'sample_size',
          message: `Need ${test.settings.minSampleSize - totalSamples} more samples for reliable results`
        });
      }
    }

    return recommendations;
  }

  // Utility methods
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async saveTest(test) {
    // In production, this would use Prisma to save to database
    // For now, we'll use a simple in-memory storage simulation
    try {
      const tests = await this.loadTestsFromStorage();
      const existingIndex = tests.findIndex(t => t.id === test.id);
      
      if (existingIndex >= 0) {
        tests[existingIndex] = test;
      } else {
        tests.push(test);
      }
      
      await this.saveTestsToStorage(tests);
    } catch (error) {
      console.error('Error saving test:', error);
    }
  }

  async loadTestsFromStorage() {
    // Simulate database storage (in production, use Prisma)
    if (!global.abTests) {
      global.abTests = {};
    }
    return global.abTests[this.shopId] || [];
  }

  async saveTestsToStorage(tests) {
    if (!global.abTests) {
      global.abTests = {};
    }
    global.abTests[this.shopId] = tests;
  }
}

/**
 * Convenience functions for use in Remix routes
 */
export async function getABTestManager(shopId) {
  return new ABTestManager(shopId);
}

export async function getActiveTestForPopup(shopId, userId) {
  const manager = new ABTestManager(shopId);
  const activeTests = await manager.getTests(AB_TEST_STATUS.ACTIVE);
  
  // Find active popup-related test
  const popupTest = activeTests.find(test => 
    test.testType === AB_TEST_TYPES.POPUP_DESIGN || 
    test.testType === AB_TEST_TYPES.MESSAGE_CONTENT
  );
  
  if (!popupTest) return null;
  
  const variant = await manager.getVariantForUser(popupTest.id, userId);
  return {
    testId: popupTest.id,
    variant
  };
}
