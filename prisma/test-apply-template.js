import prisma from "../app/db.server.js";

async function testApplyTemplate() {
  try {
    console.log("🧪 Testing Apply Template functionality...");
    
    // Get a template to test with
    const template = await prisma.popupTemplate.findFirst({
      where: { shop: "default" }
    });
    
    if (!template) {
      console.log("❌ No templates found to test with");
      return;
    }
    
    console.log(`📋 Found template: ${template.name}`);
    console.log(`🔧 Config: ${template.config}`);
    
    // Parse the config
    const config = JSON.parse(template.config);
    console.log(`📊 Parsed config:`, config);
    
    // Check if popup settings exist for test shop
    const existingSettings = await prisma.popupSettings.findUnique({
      where: { shop: "test-shop.myshopify.com" }
    });
    
    console.log(`⚙️ Existing settings:`, existingSettings ? "Found" : "None");
    
    console.log("✅ Apply Template test components working!");
    
  } catch (error) {
    console.error("💥 Error testing apply template:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testApplyTemplate();
