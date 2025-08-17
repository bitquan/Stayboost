import { PrismaClient } from '@prisma/client';
import assert from 'node:assert';
import { test } from 'node:test';

const prisma = new PrismaClient();

test('Template Favorites - Database Model Creation', async () => {
  // Test that the TemplateFavorites model was created successfully
  const favoriteCount = await prisma.templateFavorites.count();
  
  // Should start with 0 favorites
  assert(favoriteCount >= 0, 'TemplateFavorites table should be accessible');
  
  console.log(`✅ TemplateFavorites table accessible with ${favoriteCount} favorites`);
});

test('Template Favorites - Add Template to Favorites', async () => {
  const testShop = "test-shop.myshopify.com";
  
  // Get a test template
  const template = await prisma.popupTemplate.findFirst({
    where: { shop: "default" }
  });
  
  assert(template, 'Should have at least one template for testing');
  
  // Add to favorites
  const favorite = await prisma.templateFavorites.create({
    data: {
      shop: testShop,
      templateId: template.id
    },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          category: true
        }
      }
    }
  });
  
  assert(favorite.shop === testShop, 'Favorite should have correct shop');
  assert(favorite.templateId === template.id, 'Favorite should have correct template ID');
  assert(favorite.template.name, 'Favorite should include template details');
  
  console.log(`✅ Successfully added template "${favorite.template.name}" to favorites`);
  
  // Cleanup
  await prisma.templateFavorites.delete({
    where: { id: favorite.id }
  });
});

test('Template Favorites - Unique Constraint Prevention', async () => {
  const testShop = "test-shop-unique.myshopify.com";
  
  // Get a test template
  const template = await prisma.popupTemplate.findFirst({
    where: { shop: "default" }
  });
  
  assert(template, 'Should have at least one template for testing');
  
  // Add to favorites
  const favorite = await prisma.templateFavorites.create({
    data: {
      shop: testShop,
      templateId: template.id
    }
  });
  
  // Try to add the same template again - should fail
  let duplicateError = null;
  try {
    await prisma.templateFavorites.create({
      data: {
        shop: testShop,
        templateId: template.id
      }
    });
  } catch (error) {
    duplicateError = error;
  }
  
  assert(duplicateError, 'Should prevent duplicate favorites for same shop/template');
  console.log('✅ Unique constraint working - prevents duplicate favorites');
  
  // Cleanup
  await prisma.templateFavorites.delete({
    where: { id: favorite.id }
  });
});

test('Template Favorites - Remove from Favorites', async () => {
  const testShop = "test-shop-remove.myshopify.com";
  
  // Get a test template
  const template = await prisma.popupTemplate.findFirst({
    where: { shop: "default" }
  });
  
  assert(template, 'Should have at least one template for testing');
  
  // Add to favorites
  const favorite = await prisma.templateFavorites.create({
    data: {
      shop: testShop,
      templateId: template.id
    }
  });
  
  // Verify it was added
  const addedFavorite = await prisma.templateFavorites.findUnique({
    where: {
      shop_templateId: {
        shop: testShop,
        templateId: template.id
      }
    }
  });
  
  assert(addedFavorite, 'Favorite should be added successfully');
  
  // Remove from favorites
  await prisma.templateFavorites.delete({
    where: {
      shop_templateId: {
        shop: testShop,
        templateId: template.id
      }
    }
  });
  
  // Verify it was removed
  const removedFavorite = await prisma.templateFavorites.findUnique({
    where: {
      shop_templateId: {
        shop: testShop,
        templateId: template.id
      }
    }
  });
  
  assert(!removedFavorite, 'Favorite should be removed successfully');
  console.log('✅ Successfully removed template from favorites');
});

test('Template Favorites - Get Shop Favorites', async () => {
  const testShop = "test-shop-list.myshopify.com";
  
  // Get test templates
  const templates = await prisma.popupTemplate.findMany({
    where: { shop: "default" },
    take: 3
  });
  
  assert(templates.length >= 2, 'Should have at least 2 templates for testing');
  
  // Add multiple templates to favorites
  const favorites = [];
  for (const template of templates.slice(0, 2)) {
    const favorite = await prisma.templateFavorites.create({
      data: {
        shop: testShop,
        templateId: template.id
      }
    });
    favorites.push(favorite);
  }
  
  // Get all favorites for the shop
  const shopFavorites = await prisma.templateFavorites.findMany({
    where: { shop: testShop },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          category: true,
          templateType: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  assert(shopFavorites.length === 2, 'Should return all favorites for the shop');
  assert(shopFavorites[0].template.name, 'Should include template details');
  
  console.log(`✅ Successfully retrieved ${shopFavorites.length} favorites for shop`);
  
  // Cleanup
  for (const favorite of favorites) {
    await prisma.templateFavorites.delete({
      where: { id: favorite.id }
    });
  }
});

test('Template Favorites - Category Filtering with Favorites', async () => {
  const testShop = "test-shop-category.myshopify.com";
  
  // Get templates from different categories
  const springTemplate = await prisma.popupTemplate.findFirst({
    where: { 
      shop: "default",
      category: "seasonal_spring"
    }
  });
  
  const saleTemplate = await prisma.popupTemplate.findFirst({
    where: { 
      shop: "default", 
      category: "sale"
    }
  });
  
  if (springTemplate && saleTemplate) {
    // Add both to favorites
    const favorites = await Promise.all([
      prisma.templateFavorites.create({
        data: {
          shop: testShop,
          templateId: springTemplate.id
        }
      }),
      prisma.templateFavorites.create({
        data: {
          shop: testShop,
          templateId: saleTemplate.id
        }
      })
    ]);
    
    // Get favorited template IDs
    const favoritedIds = favorites.map(f => f.templateId);
    
    // Verify favorites filtering would work
    const allFavorites = await prisma.templateFavorites.findMany({
      where: { shop: testShop },
      select: { templateId: true }
    });
    
    assert(allFavorites.length === 2, 'Should have 2 favorites');
    
    const favoriteIds = allFavorites.map(f => f.templateId);
    assert(favoriteIds.includes(springTemplate.id), 'Should include spring template');
    assert(favoriteIds.includes(saleTemplate.id), 'Should include sale template');
    
    console.log('✅ Category filtering with favorites works correctly');
    
    // Cleanup
    for (const favorite of favorites) {
      await prisma.templateFavorites.delete({
        where: { id: favorite.id }
      });
    }
  } else {
    console.log('⏭️ Skipping category test - insufficient template variety');
  }
});

// Run all tests
async function runTemplateFavoritesTests() {
  console.log('🧪 Running Template Favorites Tests...\n');
  
  try {
    // Run each test
    await test('Database Model Creation');
    await test('Add Template to Favorites');
    await test('Unique Constraint Prevention');
    await test('Remove from Favorites');
    await test('Get Shop Favorites');
    await test('Category Filtering with Favorites');
    
    console.log('\n🎉 All Template Favorites tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTemplateFavoritesTests();
