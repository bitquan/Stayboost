import prisma from "../app/db.server.js";

async function checkTemplates() {
  try {
    console.log("🔍 Checking database for templates...");
    
    const templates = await prisma.popupTemplate.findMany();
    console.log(`📊 Total templates found: ${templates.length}`);
    
    if (templates.length > 0) {
      console.log("📋 Template details:");
      templates.forEach((template, index) => {
        console.log(`  ${index + 1}. ${template.name} (${template.category})`);
      });
    } else {
      console.log("❌ No templates found in database");
    }
    
  } catch (error) {
    console.error("💥 Error checking templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
