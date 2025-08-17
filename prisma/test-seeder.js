import prisma from "../app/db.server.js";

console.log("🧪 Testing template seeder...");

console.log("✅ Prisma imported successfully");

async function test() {
  try {
    console.log("🔗 Testing database connection...");
    const count = await prisma.popupTemplate.count();
    console.log(`📊 Current template count: ${count}`);
    
    console.log("🚀 Creating a test template...");
    const testTemplate = await prisma.popupTemplate.create({
      data: {
        name: "Seeder Test Template",
        category: "exit_intent",
        description: "Test template from seeder",
        config: JSON.stringify({
          title: "Test Title",
          message: "Test Message",
          discountCode: "TEST10",
          discountPercentage: 10
        }),
        templateType: "built_in",
        shop: "default"
      }
    });
    
    console.log(`✅ Created template: ${testTemplate.name} (ID: ${testTemplate.id})`);
    
  } catch (error) {
    console.error("💥 Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
