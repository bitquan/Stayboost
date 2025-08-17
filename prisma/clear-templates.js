import prisma from "../app/db.server.js";

async function clearTemplates() {
  try {
    console.log("🧹 Clearing existing templates...");
    
    const deleted = await prisma.popupTemplate.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.count} templates`);
    
  } catch (error) {
    console.error("💥 Error clearing templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTemplates();
