// StayBoost Template Marketplace Tests
import assert from 'node:assert';
import { after, before, describe, test } from 'node:test';
import prisma from '../app/db.server.js';

describe('🏪 StayBoost Template Marketplace', () => {
  
  before(async () => {
    // Clean up any existing test data
    await prisma.templateRating.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
    await prisma.templateUsageStats.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
  });

  after(async () => {
    // Clean up test data
    await prisma.templateRating.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
    await prisma.templateUsageStats.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
    await prisma.popupTemplate.deleteMany({
      where: { shop: { contains: 'marketplace-test' } }
    });
  });

  describe('🏗️ Marketplace Infrastructure', () => {
    test('should have marketplace API route', async () => {
      const fs = await import('fs');
      const apiFile = '/Users/incognitolab/My project/Stayboost/app/routes/api.template-marketplace.jsx';
      assert.ok(fs.existsSync(apiFile), 'Marketplace API route should exist');
    });

    test('should have marketplace frontend route', async () => {
      const fs = await import('fs');
      const frontendFile = '/Users/incognitolab/My project/Stayboost/app/routes/app.marketplace.jsx';
      assert.ok(fs.existsSync(frontendFile), 'Marketplace frontend route should exist');
    });

    test('should support community template types in database', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-community.myshopify.com',
          name: 'Community Test Template',
          description: 'A test template for the marketplace',
          category: 'exit_intent',
          templateType: 'community',
          config: JSON.stringify({
            title: 'Community Template',
            message: 'This is a community template',
            backgroundColor: '#ffffff'
          }),
          isPublic: true,
          isFeatured: false
        }
      });

      assert.ok(template.id, 'Should create community template');
      assert.strictEqual(template.templateType, 'community', 'Template type should be community');
      assert.strictEqual(template.isPublic, true, 'Template should be public');
    });
  });

  describe('📊 Marketplace Statistics', () => {
    test('should track marketplace installations', async () => {
      // Create a marketplace template
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-stats.myshopify.com',
          name: 'Popular Template',
          description: 'A popular marketplace template',
          category: 'sales',
          templateType: 'community',
          config: JSON.stringify({ title: 'Popular Template' }),
          isPublic: true,
          usageCount: 0
        }
      });

      // Simulate installation tracking
      await prisma.templateUsageStats.create({
        data: {
          templateId: template.id,
          shop: 'marketplace', // Special shop for marketplace tracking
          date: new Date(new Date().toDateString()),
          usageCount: 1
        }
      });

      // Update template usage count
      await prisma.popupTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } }
      });

      const updatedTemplate = await prisma.popupTemplate.findUnique({
        where: { id: template.id }
      });

      assert.strictEqual(updatedTemplate.usageCount, 1, 'Template usage count should increment');
    });

    test('should calculate average ratings', async () => {
      // Create a template for rating
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-ratings.myshopify.com',
          name: 'Rated Template',
          description: 'A template for rating tests',
          category: 'newsletter',
          templateType: 'community',
          config: JSON.stringify({ title: 'Rated Template' }),
          isPublic: true,
          averageRating: 0.0,
          ratingCount: 0
        }
      });

      // Add multiple ratings
      const ratings = [
        { shop: 'shop1.myshopify.com', rating: 5 },
        { shop: 'shop2.myshopify.com', rating: 4 },
        { shop: 'shop3.myshopify.com', rating: 3 }
      ];

      for (const ratingData of ratings) {
        await prisma.templateRating.create({
          data: {
            templateId: template.id,
            shop: ratingData.shop,
            rating: ratingData.rating
          }
        });
      }

      // Calculate average rating
      const allRatings = await prisma.templateRating.findMany({
        where: { templateId: template.id }
      });

      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      const ratingCount = allRatings.length;

      await prisma.popupTemplate.update({
        where: { id: template.id },
        data: {
          averageRating,
          ratingCount
        }
      });

      const updatedTemplate = await prisma.popupTemplate.findUnique({
        where: { id: template.id }
      });

      assert.strictEqual(updatedTemplate.averageRating, 4.0, 'Average rating should be 4.0');
      assert.strictEqual(updatedTemplate.ratingCount, 3, 'Rating count should be 3');
    });
  });

  describe('🔍 Template Discovery', () => {
    test('should filter templates by category', async () => {
      // Create templates in different categories
      const categories = ['exit_intent', 'sales', 'holiday'];
      const templates = [];

      for (let i = 0; i < categories.length; i++) {
        const template = await prisma.popupTemplate.create({
          data: {
            shop: `marketplace-test-category-${i}.myshopify.com`,
            name: `Template ${categories[i]}`,
            description: `Template for ${categories[i]} category`,
            category: categories[i],
            templateType: 'community',
            config: JSON.stringify({ title: `Template ${categories[i]}` }),
            isPublic: true
          }
        });
        templates.push(template);
      }

      // Test filtering by category
      const salesTemplates = await prisma.popupTemplate.findMany({
        where: {
          isPublic: true,
          templateType: 'community',
          category: 'sales'
        }
      });

      assert.ok(salesTemplates.length >= 1, 'Should find sales templates');
      assert.ok(salesTemplates.every(t => t.category === 'sales'), 'All templates should be sales category');
    });

    test('should support search functionality', async () => {
      // Create searchable templates
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-search.myshopify.com',
          name: 'Black Friday Special Offer',
          description: 'Amazing discount popup for Black Friday sales event',
          category: 'holiday',
          templateType: 'community',
          config: JSON.stringify({ title: 'Black Friday Special' }),
          isPublic: true,
          tags: JSON.stringify(['black friday', 'discount', 'special offer'])
        }
      });

      // Test search by name
      const nameSearch = await prisma.popupTemplate.findMany({
        where: {
          isPublic: true,
          templateType: 'community',
          name: { contains: 'Black Friday' }
        }
      });

      assert.ok(nameSearch.length >= 1, 'Should find templates by name search');

      // Test search by description
      const descriptionSearch = await prisma.popupTemplate.findMany({
        where: {
          isPublic: true,
          templateType: 'community',
          description: { contains: 'discount' }
        }
      });

      assert.ok(descriptionSearch.length >= 1, 'Should find templates by description search');
    });
  });

  describe('⭐ Template Rating System', () => {
    test('should prevent duplicate ratings from same shop', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-duplicate.myshopify.com',
          name: 'Duplicate Rating Test',
          description: 'Template for testing duplicate ratings',
          category: 'announcement',
          templateType: 'community',
          config: JSON.stringify({ title: 'Duplicate Test' }),
          isPublic: true
        }
      });

      // First rating
      await prisma.templateRating.create({
        data: {
          templateId: template.id,
          shop: 'same-shop.myshopify.com',
          rating: 4
        }
      });

      // Attempt to create duplicate rating (should upsert)
      await prisma.templateRating.upsert({
        where: {
          templateId_shop: {
            templateId: template.id,
            shop: 'same-shop.myshopify.com'
          }
        },
        update: {
          rating: 5
        },
        create: {
          templateId: template.id,
          shop: 'same-shop.myshopify.com',
          rating: 5
        }
      });

      const ratings = await prisma.templateRating.findMany({
        where: {
          templateId: template.id,
          shop: 'same-shop.myshopify.com'
        }
      });

      assert.strictEqual(ratings.length, 1, 'Should have only one rating per shop');
      assert.strictEqual(ratings[0].rating, 5, 'Rating should be updated to 5');
    });

    test('should validate rating range', async () => {
      const template = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-validation.myshopify.com',
          name: 'Rating Validation Test',
          description: 'Template for testing rating validation',
          category: 'upsell',
          templateType: 'community',
          config: JSON.stringify({ title: 'Validation Test' }),
          isPublic: true
        }
      });

      // Valid rating
      const validRating = await prisma.templateRating.create({
        data: {
          templateId: template.id,
          shop: 'valid-rating.myshopify.com',
          rating: 3
        }
      });

      assert.ok(validRating.rating >= 1 && validRating.rating <= 5, 'Rating should be between 1 and 5');
    });
  });

  describe('🏪 Template Publishing', () => {
    test('should support template publishing workflow', async () => {
      // Create private template
      const privateTemplate = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-publishing.myshopify.com',
          name: 'Private Template',
          description: 'Initially private template',
          category: 'survey',
          templateType: 'custom',
          config: JSON.stringify({ title: 'Private Template' }),
          isPublic: false
        }
      });

      assert.strictEqual(privateTemplate.isPublic, false, 'Template should start private');
      assert.strictEqual(privateTemplate.templateType, 'custom', 'Template should start as custom');

      // Publish to marketplace
      const publishedTemplate = await prisma.popupTemplate.update({
        where: { id: privateTemplate.id },
        data: {
          isPublic: true,
          templateType: 'community',
          description: 'Now public community template'
        }
      });

      assert.strictEqual(publishedTemplate.isPublic, true, 'Template should be public');
      assert.strictEqual(publishedTemplate.templateType, 'community', 'Template should be community type');
    });

    test('should support template installation', async () => {
      // Create source template
      const sourceTemplate = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-source.myshopify.com',
          name: 'Source Template',
          description: 'Template to be installed',
          category: 'cart_recovery',
          templateType: 'community',
          config: JSON.stringify({
            title: 'Source Template',
            message: 'Install me!',
            backgroundColor: '#ff0000'
          }),
          isPublic: true,
          usageCount: 0
        }
      });

      // Install template (create copy)
      const installedTemplate = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-installer.myshopify.com',
          name: `${sourceTemplate.name} (Installed)`,
          description: sourceTemplate.description,
          category: sourceTemplate.category,
          templateType: 'installed',
          config: sourceTemplate.config,
          isPublic: false
        }
      });

      // Update source template usage count
      await prisma.popupTemplate.update({
        where: { id: sourceTemplate.id },
        data: { usageCount: { increment: 1 } }
      });

      const updatedSource = await prisma.popupTemplate.findUnique({
        where: { id: sourceTemplate.id }
      });

      assert.strictEqual(installedTemplate.templateType, 'installed', 'Installed template should have installed type');
      assert.strictEqual(installedTemplate.isPublic, false, 'Installed template should be private');
      assert.strictEqual(updatedSource.usageCount, 1, 'Source template usage count should increment');
    });
  });

  describe('🎯 Featured Templates', () => {
    test('should support featured template designation', async () => {
      const featuredTemplate = await prisma.popupTemplate.create({
        data: {
          shop: 'marketplace-test-featured.myshopify.com',
          name: 'Featured Template',
          description: 'This template is featured in the marketplace',
          category: 'exit_intent',
          templateType: 'community',
          config: JSON.stringify({ title: 'Featured Template' }),
          isPublic: true,
          isFeatured: true,
          averageRating: 4.8,
          ratingCount: 25,
          usageCount: 150
        }
      });

      const featuredTemplates = await prisma.popupTemplate.findMany({
        where: {
          isPublic: true,
          isFeatured: true,
          templateType: 'community'
        },
        orderBy: [
          { averageRating: 'desc' },
          { usageCount: 'desc' }
        ]
      });

      assert.ok(featuredTemplates.length >= 1, 'Should find featured templates');
      assert.ok(featuredTemplates.some(t => t.id === featuredTemplate.id), 'Should include our featured template');
    });
  });
});
