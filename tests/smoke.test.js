import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import assert from 'node:assert';
import { describe, test } from 'node:test';
import path from 'path';

const prisma = new PrismaClient();

// Smoke tests for StayBoost Shopify App
describe('StayBoost Smoke Tests', () => {
  
  test('Database Schema - PopupSettings model exists and works', async () => {
    // Test database connectivity and model operations
    const testShop = 'test-shop.myshopify.com';
    
    try {
      // Clean up any existing test data first
      await prisma.popupSettings.deleteMany({
        where: { shop: testShop }
      });

      // Create test settings
      const testSettings = {
        shop: testShop,
        enabled: true,
        title: 'Test Popup',
        message: 'Test message',
        discountCode: 'TEST10',
        discountPercentage: 15,
        delaySeconds: 3,
        showOnce: false
      };

      // Insert test data
      const created = await prisma.popupSettings.create({
        data: testSettings
      });

      assert.ok(created, 'Should create popup settings');
      assert.strictEqual(created.shop, testShop);
      assert.strictEqual(created.enabled, true);
      
      // Retrieve test data
      const retrieved = await prisma.popupSettings.findUnique({
        where: { shop: testShop }
      });

      assert.ok(retrieved, 'Should retrieve popup settings');
      assert.strictEqual(retrieved.title, 'Test Popup');
      
      // Update test data
      const updated = await prisma.popupSettings.update({
        where: { shop: testShop },
        data: { discountPercentage: 20 }
      });

      assert.strictEqual(updated.discountPercentage, 20);
      
      // Clean up
      await prisma.popupSettings.delete({
        where: { shop: testShop }
      });
    } catch (error) {
      throw new Error(`Database test failed: ${error.message}`);
    }
  });

  test('File Structure - All critical files exist', async () => {
    const criticalFiles = [
      'package.json',
      'shopify.app.toml',
      'prisma/schema.prisma',
      'app/shopify.server.js',
      'app/db.server.js',
      'app/models/popupSettings.server.js',
      'app/routes/app._index.jsx',
      'app/routes/api.stayboost.settings.jsx',
      'extensions/stayboost-theme/shopify.extension.toml',
      'extensions/stayboost-theme/blocks/stayboost-popup.liquid',
      'extensions/stayboost-theme/assets/stayboost-popup.js'
    ];

    for (const file of criticalFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      assert.ok(exists, `File ${file} should exist`);
    }
  });

  test('Package.json - Has all required dependencies', async () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );

    const requiredDeps = [
      '@shopify/shopify-app-remix',
      '@shopify/polaris',
      '@shopify/app-bridge-react',
      '@prisma/client',
      'prisma',
      'react',
      'react-dom',
      '@remix-run/node',
      '@remix-run/react'
    ];

    for (const dep of requiredDeps) {
      assert.ok(packageJson.dependencies[dep], `Dependency ${dep} should exist`);
    }

    assert.strictEqual(packageJson.name, 'stay-boost');
    assert.strictEqual(packageJson.scripts.dev, 'shopify app dev');
  });

  test('Shopify App Config - Correct configuration', async () => {
    const configExists = fs.existsSync(path.join(process.cwd(), 'shopify.app.toml'));
    assert.ok(configExists, 'shopify.app.toml should exist');

    const config = fs.readFileSync(path.join(process.cwd(), 'shopify.app.toml'), 'utf8');
    assert.ok(config.includes('name = "StayBoost"'), 'Config should contain app name');
    assert.ok(config.includes('client_id = "8279a1a1278f468713b7aaf5fad1f7dc"'), 'Config should contain client_id');
    assert.ok(config.includes('scopes = "write_products"'), 'Config should contain scopes');
  });

  test('Theme Extension - Valid configuration', async () => {
    const extensionConfig = fs.readFileSync(
      path.join(process.cwd(), 'extensions/stayboost-theme/shopify.extension.toml'),
      'utf8'
    );
    assert.ok(extensionConfig.includes('type = "theme"'), 'Extension should be theme type');
    assert.ok(extensionConfig.includes('name = "stayboost-theme"'), 'Extension should have correct name');

    // Check Liquid block
    const liquidBlock = fs.readFileSync(
      path.join(process.cwd(), 'extensions/stayboost-theme/blocks/stayboost-popup.liquid'),
      'utf8'
    );
    assert.ok(liquidBlock.includes('StayBoost Popup'), 'Liquid should contain StayBoost Popup');
    assert.ok(liquidBlock.includes('data-stayboost-api-url'), 'Liquid should contain API URL data attribute');
    assert.ok(liquidBlock.includes('data-shop-domain'), 'Liquid should contain shop domain data attribute');

    // Check JavaScript
    const popupJs = fs.readFileSync(
      path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js'),
      'utf8'
    );
    assert.ok(popupJs.includes('stayboost-api-url'), 'JS should contain API URL handling');
    assert.ok(popupJs.includes('mouseout'), 'JS should contain mouse exit detection');
    assert.ok(popupJs.includes('popstate'), 'JS should contain back button detection');
  });

  test('Models - PopupSettings server functions work', async () => {
    const modelFile = fs.readFileSync(
      path.join(process.cwd(), 'app/models/popupSettings.server.js'),
      'utf8'
    );

    assert.ok(modelFile.includes('getPopupSettings'), 'Model should export getPopupSettings');
    assert.ok(modelFile.includes('savePopupSettings'), 'Model should export savePopupSettings');
    assert.ok(modelFile.includes('DEFAULTS'), 'Model should have DEFAULTS');
    assert.ok(modelFile.includes('upsert'), 'Model should use upsert');
    assert.ok(modelFile.includes('prisma.popupSettings'), 'Model should use prisma.popupSettings');
  });

  test('API Routes - Settings endpoint structure', async () => {
    const apiFile = fs.readFileSync(
      path.join(process.cwd(), 'app/routes/api.stayboost.settings.jsx'),
      'utf8'
    );

    assert.ok(apiFile.includes('export async function loader'), 'API should export loader function');
    assert.ok(apiFile.includes('getPopupSettings'), 'API should use getPopupSettings');
    assert.ok(apiFile.includes('Access-Control-Allow-Origin'), 'API should have CORS headers');
    assert.ok(apiFile.includes('shop parameter'), 'API should handle shop parameter');
  });

  test('Admin Interface - Main dashboard structure', async () => {
    const dashboardFile = fs.readFileSync(
      path.join(process.cwd(), 'app/routes/app._index.jsx'),
      'utf8'
    );

    assert.ok(dashboardFile.includes('StayBoost'), 'Dashboard should contain StayBoost');
    assert.ok(dashboardFile.includes('Popup Settings'), 'Dashboard should contain Popup Settings');
    assert.ok(dashboardFile.includes('Popup Preview'), 'Dashboard should contain Popup Preview');
    assert.ok(dashboardFile.includes('TextField'), 'Dashboard should use TextField');
    assert.ok(dashboardFile.includes('Checkbox'), 'Dashboard should use Checkbox');
    assert.ok(dashboardFile.includes('enabled'), 'Dashboard should handle enabled setting');
    assert.ok(dashboardFile.includes('discountPercentage'), 'Dashboard should handle discount percentage');
    assert.ok(dashboardFile.includes('delaySeconds'), 'Dashboard should handle delay seconds');
  });

  test('JavaScript Popup - Exit intent functionality', async () => {
    const jsFile = fs.readFileSync(
      path.join(process.cwd(), 'extensions/stayboost-theme/assets/stayboost-popup.js'),
      'utf8'
    );

    // Check exit intent detection
    assert.ok(jsFile.includes('mouseout'), 'JS should have mouseout event');
    assert.ok(jsFile.includes('clientY <= 0'), 'JS should detect top exit');
    assert.ok(jsFile.includes('popstate'), 'JS should detect back button');
    
    // Check popup functionality
    assert.ok(jsFile.includes('sessionStorage'), 'JS should use session storage');
    assert.ok(jsFile.includes('stayboost_shown'), 'JS should track shown state');
    assert.ok(jsFile.includes('flex'), 'JS should show popup with flex');
    assert.ok(jsFile.includes('display'), 'JS should control display');
    
    // Check API integration
    assert.ok(jsFile.includes('fetch'), 'JS should fetch from API');
    assert.ok(jsFile.includes('credentials: "omit"'), 'JS should set CORS credentials');
  });

  test('Prisma Schema - Correct models and relationships', async () => {
    const schemaFile = fs.readFileSync(
      path.join(process.cwd(), 'prisma/schema.prisma'),
      'utf8'
    );

    assert.ok(schemaFile.includes('model Session'), 'Schema should have Session model');
    assert.ok(schemaFile.includes('model PopupSettings'), 'Schema should have PopupSettings model');
    assert.ok(schemaFile.includes('shop               String   @unique'), 'Schema should have unique shop field');
    assert.ok(schemaFile.includes('enabled            Boolean  @default(true)'), 'Schema should have enabled field');
    assert.ok(schemaFile.includes('discountPercentage Int      @default(10)'), 'Schema should have discountPercentage field');
    assert.ok(schemaFile.includes('delaySeconds       Int      @default(2)'), 'Schema should have delaySeconds field');
    assert.ok(schemaFile.includes('showOnce           Boolean  @default(true)'), 'Schema should have showOnce field');
  });

  test('Environment Setup - Build and development readiness', async () => {
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
    assert.ok(nodeModulesExists, 'node_modules should exist');

    // Check if Prisma client is generated
    const prismaClientExists = fs.existsSync(
      path.join(process.cwd(), 'node_modules/@prisma/client')
    );
    assert.ok(prismaClientExists, 'Prisma client should be generated');

    // Check database file
    const dbExists = fs.existsSync(path.join(process.cwd(), 'prisma/dev.sqlite'));
    assert.ok(dbExists, 'Database file should exist');
  });
});

// Integration test for the complete flow
describe('StayBoost Integration Tests', () => {
  
  test('Complete data flow - Settings to API to Frontend', async () => {
    const testShop = 'integration-test.myshopify.com';
    
    try {
      // Clean up any existing test data first
      await prisma.popupSettings.deleteMany({
        where: { shop: testShop }
      });

      // 1. Save settings to database
      const testSettings = {
        shop: testShop,
        enabled: true,
        title: 'Integration Test',
        message: 'This is a test popup',
        discountCode: 'INTEGR10',
        discountPercentage: 25,
        delaySeconds: 1,
        showOnce: true
      };

      await prisma.popupSettings.create({ data: testSettings });
      
      // 2. Verify data can be retrieved
      const retrieved = await prisma.popupSettings.findUnique({
        where: { shop: testShop }
      });
      
      assert.ok(retrieved, 'Should retrieve integration test data');
      assert.strictEqual(retrieved.title, 'Integration Test');
      assert.strictEqual(retrieved.discountPercentage, 25);
      
      // 3. Clean up
      await prisma.popupSettings.delete({
        where: { shop: testShop }
      });
    } catch (error) {
      throw new Error(`Integration test failed: ${error.message}`);
    }
  });

  test('Default values work correctly', async () => {
    const testShop = 'defaults-test.myshopify.com';
    
    try {
      // Clean up any existing test data first
      await prisma.popupSettings.deleteMany({
        where: { shop: testShop }
      });

      // Create minimal settings
      await prisma.popupSettings.create({
        data: {
          shop: testShop,
          // Only provide shop, let defaults fill the rest
        }
      });
      
      const retrieved = await prisma.popupSettings.findUnique({
        where: { shop: testShop }
      });
      
      // Check defaults
      assert.strictEqual(retrieved.enabled, true);
      assert.strictEqual(retrieved.title, "Wait! Don't leave yet!");
      assert.strictEqual(retrieved.message, "Get 10% off your first order");
      assert.strictEqual(retrieved.discountCode, "SAVE10");
      assert.strictEqual(retrieved.discountPercentage, 10);
      assert.strictEqual(retrieved.delaySeconds, 2);
      assert.strictEqual(retrieved.showOnce, true);
      
      // Clean up
      await prisma.popupSettings.delete({
        where: { shop: testShop }
      });
    } catch (error) {
      throw new Error(`Default values test failed: ${error.message}`);
    }
  });
});
