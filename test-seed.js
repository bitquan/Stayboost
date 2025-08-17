import prisma from "./app/db.server.js";

// Simple seeder test
console.log("🌱 Starting template seeder...");

async function test() {
  try {
    console.log("Testing database connection...");
    const count = await prisma.popupTemplate.count();
    console.log(`Current template count: ${count}`);
    
    console.log("✅ Database connection successful!");
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
