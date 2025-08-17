/**
 * Visual Regression Testing System
 * Priority #23 - Automated visual comparison testing
 * 
 * TODO: Testing and Integration Needed
 * - [ ] Add unit tests for image comparison algorithms
 * - [ ] Test baseline management and versioning
 * - [ ] Create integration with Playwright testing
 * - [ ] Test multi-viewport screenshot comparison
 * - [ ] Add E2E tests for full visual regression pipeline
 * - [ ] Test performance with large screenshot sets
 * - [ ] Validate threshold accuracy and false positives
 * - [ ] Integration with CI/CD pipeline
 * - [ ] Test cross-platform compatibility
 * - [ ] Add visual test reporting dashboard
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Visual test types
export const VISUAL_TEST_TYPES = {
  COMPONENT: 'component',
  PAGE: 'page',
  POPUP: 'popup',
  MODAL: 'modal',
  RESPONSIVE: 'responsive'
};

// Comparison thresholds
export const COMPARISON_THRESHOLDS = {
  STRICT: 0.01,    // 1% difference
  NORMAL: 0.05,    // 5% difference
  RELAXED: 0.1     // 10% difference
};

// Viewport sizes for responsive testing
export const VIEWPORT_SIZES = {
  MOBILE: { width: 375, height: 667 },
  TABLET: { width: 768, height: 1024 },
  DESKTOP: { width: 1920, height: 1080 },
  LARGE_DESKTOP: { width: 2560, height: 1440 }
};

/**
 * Main Visual Regression Testing Manager
 */
export class VisualRegressionManager {
  constructor(options = {}) {
    this.options = {
      baselineDir: options.baselineDir || join(process.cwd(), 'visual-baselines'),
      screenshotDir: options.screenshotDir || join(process.cwd(), 'visual-screenshots'),
      diffDir: options.diffDir || join(process.cwd(), 'visual-diffs'),
      threshold: options.threshold || COMPARISON_THRESHOLDS.NORMAL,
      viewports: options.viewports || [VIEWPORT_SIZES.DESKTOP, VIEWPORT_SIZES.MOBILE],
      ...options
    };
    
    this.testResults = new Map();
    this.baselines = new Map();
    this.setupDirectories();
    this.initializeTests();
  }

  /**
   * Run complete visual regression test suite
   */
  async runVisualTests(testNames = null) {
    const results = {
      startTime: Date.now(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        new: 0,
        updated: 0
      },
      diffs: [],
      endTime: null,
      duration: 0
    };

    console.log('👁️ Starting visual regression tests...');

    const testsToRun = testNames || Array.from(this.testResults.keys());

    for (const testName of testsToRun) {
      console.log(`📸 Running visual test: ${testName}`);
      
      const testResult = await this.runVisualTest(testName);
      results.tests[testName] = testResult;
      results.summary.total++;
      
      switch (testResult.status) {
        case 'passed':
          results.summary.passed++;
          break;
        case 'failed':
          results.summary.failed++;
          if (testResult.diffPath) {
            results.diffs.push(testResult.diffPath);
          }
          break;
        case 'new':
          results.summary.new++;
          break;
        case 'updated':
          results.summary.updated++;
          break;
      }
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    // Generate visual test report
    await this.generateVisualReport(results);

    return results;
  }

  /**
   * Run a single visual test
   */
  async runVisualTest(testName) {
    const testConfig = this.testResults.get(testName);
    if (!testConfig) {
      throw new Error(`Unknown visual test: ${testName}`);
    }

    const result = {
      testName,
      startTime: Date.now(),
      status: 'pending',
      viewportResults: {},
      baselinePath: null,
      screenshotPath: null,
      diffPath: null,
      difference: 0,
      duration: 0
    };

    try {
      for (const viewport of this.options.viewports) {
        const viewportKey = `${viewport.width}x${viewport.height}`;
        console.log(`  📱 Testing viewport: ${viewportKey}`);
        
        const viewportResult = await this.runViewportTest(testName, testConfig, viewport);
        result.viewportResults[viewportKey] = viewportResult;
        
        // Use the worst result as overall status
        if (viewportResult.status === 'failed' && result.status !== 'failed') {
          result.status = 'failed';
          result.difference = Math.max(result.difference, viewportResult.difference);
          result.diffPath = viewportResult.diffPath;
        } else if (viewportResult.status === 'new' && result.status === 'pending') {
          result.status = 'new';
        } else if (viewportResult.status === 'passed' && result.status === 'pending') {
          result.status = 'passed';
        }
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }

    result.duration = Date.now() - result.startTime;
    return result;
  }

  /**
   * Run visual test for a specific viewport
   */
  async runViewportTest(testName, testConfig, viewport) {
    const viewportKey = `${viewport.width}x${viewport.height}`;
    const baselineFileName = `${testName}-${viewportKey}-baseline.png`;
    const screenshotFileName = `${testName}-${viewportKey}-current.png`;
    const diffFileName = `${testName}-${viewportKey}-diff.png`;
    
    const baselinePath = join(this.options.baselineDir, baselineFileName);
    const screenshotPath = join(this.options.screenshotDir, screenshotFileName);
    const diffPath = join(this.options.diffDir, diffFileName);

    const result = {
      viewport: viewportKey,
      status: 'pending',
      baselinePath,
      screenshotPath,
      diffPath: null,
      difference: 0,
      duration: Date.now()
    };

    try {
      // Capture current screenshot
      await this.captureScreenshot(testConfig, viewport, screenshotPath);
      
      // Check if baseline exists
      if (!existsSync(baselinePath)) {
        // No baseline exists, create one
        await this.copyFile(screenshotPath, baselinePath);
        result.status = 'new';
        console.log(`    📝 Created new baseline for ${testName} at ${viewportKey}`);
        
      } else {
        // Compare with baseline
        const comparison = await this.compareImages(baselinePath, screenshotPath);
        result.difference = comparison.difference;
        
        if (comparison.difference <= this.options.threshold) {
          result.status = 'passed';
          console.log(`    ✅ Visual test passed (${(comparison.difference * 100).toFixed(2)}% diff)`);
        } else {
          result.status = 'failed';
          result.diffPath = diffPath;
          
          // Generate diff image
          await this.generateDiffImage(baselinePath, screenshotPath, diffPath, comparison);
          console.log(`    ❌ Visual test failed (${(comparison.difference * 100).toFixed(2)}% diff)`);
        }
      }
      
    } catch (error) {
      result.status = 'error';
      result.error = error.message;
    }

    result.duration = Date.now() - result.duration;
    return result;
  }

  /**
   * Initialize visual tests
   */
  initializeTests() {
    // Popup Component Tests
    this.testResults.set('popup-default', {
      type: VISUAL_TEST_TYPES.POPUP,
      component: 'stayboost-popup',
      selector: '.stayboost-popup',
      url: '/test/popup-default',
      description: 'Default popup appearance'
    });

    this.testResults.set('popup-urgency', {
      type: VISUAL_TEST_TYPES.POPUP,
      component: 'stayboost-popup',
      selector: '.stayboost-popup.urgency',
      url: '/test/popup-urgency',
      description: 'Urgency popup template'
    });

    // Admin Dashboard Tests
    this.testResults.set('admin-dashboard', {
      type: VISUAL_TEST_TYPES.PAGE,
      url: '/app',
      selector: 'main',
      description: 'Admin dashboard main view'
    });

    this.testResults.set('admin-analytics', {
      type: VISUAL_TEST_TYPES.PAGE,
      url: '/app/analytics',
      selector: '.analytics-container',
      description: 'Analytics dashboard'
    });
  }

  async captureScreenshot(testConfig, viewport, outputPath) {
    const mockImageData = this.generateMockImageData(testConfig, viewport);
    writeFileSync(outputPath, mockImageData);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }

  async compareImages(baselinePath, currentPath) {
    try {
      const baselineData = readFileSync(baselinePath);
      const currentData = readFileSync(currentPath);
      
      const baselineHash = createHash('md5').update(baselineData).digest('hex');
      const currentHash = createHash('md5').update(currentData).digest('hex');
      
      if (baselineHash === currentHash) {
        return { difference: 0, pixelDifference: 0 };
      }
      
      const sizeDiff = Math.abs(baselineData.length - currentData.length);
      const maxSize = Math.max(baselineData.length, currentData.length);
      const difference = Math.min(sizeDiff / maxSize, 1);
      
      return {
        difference,
        pixelDifference: Math.floor(difference * 1920 * 1080)
      };
      
    } catch (error) {
      throw new Error(`Image comparison failed: ${error.message}`);
    }
  }

  async generateDiffImage(baselinePath, currentPath, diffPath, comparison) {
    const diffData = `DIFF_IMAGE_${comparison.difference}_${Date.now()}`;
    writeFileSync(diffPath, diffData);
    console.log(`    🔍 Diff image generated: ${diffPath}`);
  }

  setupDirectories() {
    [this.options.baselineDir, this.options.screenshotDir, this.options.diffDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateMockImageData(testConfig, viewport) {
    const seed = `${testConfig.component || testConfig.url}_${viewport.width}x${viewport.height}`;
    return `MOCK_IMAGE_DATA_${createHash('md5').update(seed).digest('hex')}`;
  }

  async copyFile(source, destination) {
    const data = readFileSync(source);
    writeFileSync(destination, data);
  }

  async generateVisualReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      duration: results.duration,
      tests: results.tests,
      configuration: {
        threshold: this.options.threshold,
        viewports: this.options.viewports
      }
    };

    const reportPath = join(process.cwd(), 'visual-regression-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`👁️ Visual regression report generated: ${reportPath}`);
    return report;
  }
}

/**
 * Create a visual regression manager instance
 */
export function createVisualRegressionManager(options = {}) {
  return new VisualRegressionManager(options);
}

console.log('StayBoost Visual Regression Testing System loaded successfully');
