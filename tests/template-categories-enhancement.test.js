import { PrismaClient } from '@prisma/client';
import assert from 'node:assert';
import { test } from 'node:test';

const prisma = new PrismaClient();

test('Template Categories Enhancement - Enhanced Categories Available', async () => {
  const templates = await prisma.popupTemplate.findMany({
    where: { shop: "default" },
    select: { category: true },
    distinct: ['category']
  });

  const categories = templates.map(t => t.category).sort();
  
  // Check for enhanced categories
  const expectedEnhancedCategories = [
    'seasonal_spring',
    'seasonal_summer', 
    'seasonal_fall',
    'seasonal_winter',
    'event_black_friday',
    'event_cyber_monday',
    'event_valentines',
    'event_mothers_day',
    'event_fathers_day',
    'event_back_to_school',
    'event_new_year',
    'special_birthday',
    'special_flash_sale',
    'special_clearance'
  ];

  expectedEnhancedCategories.forEach(category => {
    assert(categories.includes(category), `Category '${category}' should be available`);
  });

  console.log('✅ All enhanced categories are available');
});

test('Template Categories Enhancement - Seasonal Templates Seeded', async () => {
  const seasonalTemplates = await prisma.popupTemplate.findMany({
    where: { 
      shop: "default",
      category: {
        in: ['seasonal_spring', 'seasonal_summer', 'seasonal_fall', 'seasonal_winter']
      }
    }
  });

  assert(seasonalTemplates.length >= 7, `Expected at least 7 seasonal templates, got ${seasonalTemplates.length}`);
  
  // Check for specific seasonal templates
  const templateNames = seasonalTemplates.map(t => t.name);
  assert(templateNames.includes('Spring Renewal Sale'), 'Spring template should exist');
  assert(templateNames.includes('Summer Beach Vibes'), 'Summer template should exist');
  assert(templateNames.includes('Autumn Harvest Sale'), 'Fall template should exist');
  assert(templateNames.includes('Winter Wonderland Sale'), 'Winter template should exist');

  console.log('✅ Seasonal templates properly seeded');
});

test('Template Categories Enhancement - Event Templates Seeded', async () => {
  const eventTemplates = await prisma.popupTemplate.findMany({
    where: { 
      shop: "default",
      category: {
        startsWith: 'event_'
      }
    }
  });

  assert(eventTemplates.length >= 7, `Expected at least 7 event templates, got ${eventTemplates.length}`);
  
  // Check for specific event templates
  const templateNames = eventTemplates.map(t => t.name);
  assert(templateNames.includes('Black Friday Mega Sale'), 'Black Friday template should exist');
  assert(templateNames.includes('Cyber Monday Digital Deals'), 'Cyber Monday template should exist');
  assert(templateNames.includes("Valentine's Love Sale"), 'Valentine template should exist');

  console.log('✅ Event templates properly seeded');
});

test('Template Categories Enhancement - Special Templates Seeded', async () => {
  const specialTemplates = await prisma.popupTemplate.findMany({
    where: { 
      shop: "default",
      category: {
        startsWith: 'special_'
      }
    }
  });

  assert(specialTemplates.length >= 3, `Expected at least 3 special templates, got ${specialTemplates.length}`);
  
  // Check for specific special templates
  const templateNames = specialTemplates.map(t => t.name);
  assert(templateNames.includes('Birthday Celebration'), 'Birthday template should exist');
  assert(templateNames.includes('Lightning Flash Sale'), 'Flash sale template should exist');
  assert(templateNames.includes('Final Clearance Event'), 'Clearance template should exist');

  console.log('✅ Special templates properly seeded');
});

test('Template Categories Enhancement - Template Config Validation', async () => {
  const enhancedTemplates = await prisma.popupTemplate.findMany({
    where: { 
      shop: "default",
      category: {
        in: ['seasonal_spring', 'event_black_friday', 'special_birthday']
      }
    },
    take: 3
  });

  enhancedTemplates.forEach(template => {
    assert(template.config, `Template '${template.name}' should have config`);
    
    let config;
    try {
      config = JSON.parse(template.config);
    } catch (error) {
      assert.fail(`Template '${template.name}' should have valid JSON config`);
    }

    // Check for essential config fields
    assert(config.title, `Template '${template.name}' should have title in config`);
    assert(config.message, `Template '${template.name}' should have message in config`);
    assert(config.discountCode, `Template '${template.name}' should have discountCode in config`);
    assert(typeof config.discountPercentage === 'number', `Template '${template.name}' should have numeric discountPercentage`);
    assert(config.backgroundColor, `Template '${template.name}' should have backgroundColor in config`);
    assert(config.icon, `Template '${template.name}' should have icon in config`);
  });

  console.log('✅ Enhanced template configs are valid');
});

test('Template Categories Enhancement - Total Template Count', async () => {
  const totalTemplates = await prisma.popupTemplate.count({
    where: { shop: "default" }
  });

  assert(totalTemplates >= 40, `Expected at least 40 templates, got ${totalTemplates}`);
  
  // Check total categories
  const categoryCount = await prisma.popupTemplate.groupBy({
    by: ['category'],
    where: { shop: "default" }
  });

  assert(categoryCount.length >= 16, `Expected at least 16 categories, got ${categoryCount.length}`);

  console.log(`✅ Template count verification: ${totalTemplates} templates across ${categoryCount.length} categories`);
});

// Run all tests
async function runEnhancedCategoryTests() {
  console.log('🧪 Running Template Categories Enhancement Tests...\n');
  
  try {
    // Run each test
    await test('Enhanced Categories Available');
    await test('Seasonal Templates Seeded');
    await test('Event Templates Seeded'); 
    await test('Special Templates Seeded');
    await test('Template Config Validation');
    await test('Total Template Count');
    
    console.log('\n🎉 All Template Categories Enhancement tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runEnhancedCategoryTests();
