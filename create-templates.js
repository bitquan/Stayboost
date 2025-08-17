// Quick manual template creator
import prisma from "./app/db.server.js";

console.log("🌱 Creating sample templates...");

async function createSampleTemplates() {
  try {
    console.log("Creating sample templates...");
    
    const template1 = await prisma.popupTemplate.create({
      data: {
        name: "Test Exit Intent",
        category: "exit_intent",
        description: "A classic exit intent popup to capture leaving visitors",
        config: JSON.stringify({
          title: "Wait! Don't leave yet!",
          message: "Get 10% off your first order",
          discountCode: "TEST10",
          discountPercentage: 10,
          backgroundColor: "#ffffff",
          textColor: "#333333",
          buttonColor: "#5c6ac4",
          fontSize: "16px",
          borderRadius: "8px"
        }),
        templateType: "built_in",
        shop: "default"
      }
    });
    
    console.log("✅ Created template:", template1.name);
    
    // Check total count
    const count = await prisma.popupTemplate.count();
    console.log(`Total templates: ${count}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleTemplates();
