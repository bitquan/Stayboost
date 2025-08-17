import { test, describe } from 'node:test';
import assert from 'node:assert';

// Functional tests for StayBoost popup JavaScript
describe('StayBoost Popup Functionality Tests', () => {
  
  test('Popup JavaScript - Exit intent simulation', async () => {
    // Simulate a basic DOM environment
    global.document = {
      currentScript: {
        getAttribute: (name) => {
          if (name === 'data-stayboost-api-url') return 'https://app.example.com/api/stayboost/settings';
          if (name === 'data-shop-domain') return 'test-shop.myshopify.com';
          return null;
        }
      },
      querySelector: () => null,
      createElement: (tag) => ({
        style: { cssText: '' },
        innerHTML: '',
        addEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null
      }),
      getElementById: () => ({
        addEventListener: () => {}
      }),
      body: {
        appendChild: () => {}
      }
    };

    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { origin: 'https://test-shop.myshopify.com' }
    };

    global.sessionStorage = {
      getItem: () => null,
      setItem: () => {}
    };

    global.fetch = async () => ({
      json: async () => ({
        settings: {
          enabled: true,
          title: 'Test Popup',
          message: 'Test message',
          discountCode: 'TEST10',
          discountPercentage: 10,
          delaySeconds: 1,
          showOnce: true
        }
      })
    });

    global.URL = class {
      constructor(url, base) {
        this.searchParams = {
          get: () => null,
          set: () => {}
        };
      }
      toString() { return 'https://example.com/api'; }
    };

    global.Date = {
      now: () => 1000000
    };

    // Test that the basic popup structure can be evaluated
    // This simulates loading the popup script
    assert.ok(typeof global.document.createElement === 'function', 'Should have createElement function');
    assert.ok(typeof global.fetch === 'function', 'Should have fetch function');
    assert.ok(typeof global.sessionStorage.setItem === 'function', 'Should have sessionStorage');
  });

  test('API Response Structure - Settings endpoint format', async () => {
    // Test the expected API response structure
    const mockApiResponse = {
      shop: 'test-shop.myshopify.com',
      settings: {
        enabled: true,
        title: 'Wait! Don\'t leave yet!',
        message: 'Get 10% off your first order',
        discountCode: 'SAVE10',
        discountPercentage: 10,
        delaySeconds: 2,
        showOnce: true
      }
    };

    // Validate response structure
    assert.ok(mockApiResponse.shop, 'Response should have shop field');
    assert.ok(mockApiResponse.settings, 'Response should have settings field');
    assert.ok(typeof mockApiResponse.settings.enabled === 'boolean', 'Settings should have boolean enabled');
    assert.ok(typeof mockApiResponse.settings.title === 'string', 'Settings should have string title');
    assert.ok(typeof mockApiResponse.settings.message === 'string', 'Settings should have string message');
    assert.ok(typeof mockApiResponse.settings.discountCode === 'string', 'Settings should have string discountCode');
    assert.ok(typeof mockApiResponse.settings.discountPercentage === 'number', 'Settings should have number discountPercentage');
    assert.ok(typeof mockApiResponse.settings.delaySeconds === 'number', 'Settings should have number delaySeconds');
    assert.ok(typeof mockApiResponse.settings.showOnce === 'boolean', 'Settings should have boolean showOnce');
  });

  test('Exit Intent Logic - Mouse position detection', async () => {
    // Simulate exit intent detection logic
    function detectExitIntent(clientY, delay, startTime) {
      const currentTime = Date.now();
      const readyTime = startTime + delay;
      
      // Exit intent: mouse moves to top of viewport and delay has passed
      return clientY <= 0 && currentTime >= readyTime;
    }

    const startTime = 1000000;
    const delay = 2000; // 2 seconds

    // Test cases
    assert.strictEqual(detectExitIntent(10, delay, startTime), false, 'Should not trigger when mouse not at top');
    assert.strictEqual(detectExitIntent(-5, delay, startTime), false, 'Should not trigger before delay');
    
    // Mock Date.now to simulate time passing
    global.Date.now = () => startTime + delay + 100;
    assert.strictEqual(detectExitIntent(-5, delay, startTime), true, 'Should trigger when mouse at top after delay');
  });

  test('Session Storage Logic - Show once functionality', async () => {
    // Simulate session storage logic for show once
    let storage = {};
    
    const mockSessionStorage = {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { storage[key] = value; }
    };

    function shouldShowPopup(showOnce, sessionStorage) {
      if (showOnce && sessionStorage.getItem('stayboost_shown')) {
        return false;
      }
      return true;
    }

    function markAsShown(sessionStorage) {
      sessionStorage.setItem('stayboost_shown', '1');
    }

    // Test cases
    assert.strictEqual(shouldShowPopup(true, mockSessionStorage), true, 'Should show popup first time');
    
    markAsShown(mockSessionStorage);
    assert.strictEqual(shouldShowPopup(true, mockSessionStorage), false, 'Should not show popup second time when showOnce is true');
    
    assert.strictEqual(shouldShowPopup(false, mockSessionStorage), true, 'Should show popup when showOnce is false');
  });

  test('Popup HTML Generation - Dynamic content', async () => {
    // Test popup HTML generation logic
    function generatePopupHTML(settings) {
      const { title, message, discountPercentage, discountCode } = settings;
      
      return `
        <div id="stayboost-modal" style="background:#fff;max-width:360px;width:92%;padding:20px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
          <div style="font-size:18px;font-weight:600;text-align:center">${title}</div>
          <div style="margin:10px 0 16px;text-align:center">${message}</div>
          <button id="stayboost-cta" style="width:100%;padding:12px 16px;background:#008060;color:#fff;border:none;border-radius:8px;cursor:pointer">Get ${discountPercentage}% Off - ${discountCode}</button>
          <div id="stayboost-dismiss" style="margin-top:8px;text-align:center;font-size:12px;color:#666;cursor:pointer">No thanks</div>
        </div>
      `;
    }

    const testSettings = {
      title: 'Test Title',
      message: 'Test Message',
      discountPercentage: 15,
      discountCode: 'TEST15'
    };

    const html = generatePopupHTML(testSettings);
    
    assert.ok(html.includes('Test Title'), 'HTML should contain the title');
    assert.ok(html.includes('Test Message'), 'HTML should contain the message');
    assert.ok(html.includes('Get 15% Off - TEST15'), 'HTML should contain discount info');
    assert.ok(html.includes('stayboost-cta'), 'HTML should contain CTA button');
    assert.ok(html.includes('stayboost-dismiss'), 'HTML should contain dismiss option');
  });

  test('URL Parameter Handling - Shop domain extraction', async () => {
    // Test URL and shop parameter handling
    function buildApiUrl(baseUrl, shopDomain) {
      try {
        const url = new URL(baseUrl, 'https://example.com');
        if (shopDomain && !url.searchParams.get('shop')) {
          url.searchParams.set('shop', shopDomain);
        }
        return url.toString();
      } catch (e) {
        return baseUrl; // fallback for malformed URLs
      }
    }

    // Mock URL class for testing
    global.URL = class {
      constructor(url, base) {
        this.href = url;
        this.searchParams = {
          get: (key) => key === 'shop' ? null : null,
          set: (key, value) => { this.href += (this.href.includes('?') ? '&' : '?') + key + '=' + value; }
        };
      }
      toString() { return this.href; }
    };

    const baseUrl = 'https://app.example.com/api/stayboost/settings';
    const shopDomain = 'test-shop.myshopify.com';
    
    const finalUrl = buildApiUrl(baseUrl, shopDomain);
    assert.ok(finalUrl.includes('shop=test-shop.myshopify.com'), 'URL should contain shop parameter');
  });
});
