import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    console.log('📊 Template Categories Overview\n');
    
    // Get templates grouped by category
    const templates = await prisma.popupTemplate.findMany({
      where: { shop: "default" },
      select: {
        name: true,
        category: true,
        templateType: true
      },
      orderBy: {
        category: 'asc'
      }
    });
    
    // Group by category
    const categoryCounts = {};
    templates.forEach(template => {
      if (!categoryCounts[template.category]) {
        categoryCounts[template.category] = [];
      }
      categoryCounts[template.category].push(template.name);
    });
    
    // Display results
    Object.keys(categoryCounts).sort().forEach(category => {
      console.log(`📁 ${category} (${categoryCounts[category].length} templates):`);
      categoryCounts[category].forEach(name => {
        console.log(`   • ${name}`);
      });
      console.log();
    });
    
    console.log(`✅ Total templates: ${templates.length}`);
    console.log(`📈 Total categories: ${Object.keys(categoryCounts).length}`);
    
  } catch (error) {
    console.error('❌ Error checking templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
