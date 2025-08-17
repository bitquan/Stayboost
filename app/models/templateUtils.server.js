import prisma from "../db.server";

// Default templates configuration
const DEFAULT_TEMPLATES = [
  {
    name: "Classic Exit Intent",
    category: "exit_intent",
    templateType: "built_in",
    conversionRate: 4.2,
    config: JSON.stringify({
      title: "Wait! Don't leave yet!",
      message: "Get 10% off your first order before you go",
      discountCode: "SAVE10",
      discountPercentage: 10,
      backgroundColor: "#ffffff",
      textColor: "#333333",
      buttonColor: "#5c6ac4"
    })
  },
  {
    name: "Flash Sale Alert",
    category: "sale",
    templateType: "built_in",
    conversionRate: 5.8,
    config: JSON.stringify({
      title: "⚡ 24-Hour Flash Sale!",
      message: "Save 25% on everything - Limited time only!",
      discountCode: "FLASH25",
      discountPercentage: 25,
      backgroundColor: "#ff6b6b",
      textColor: "#ffffff",
      buttonColor: "#ffffff"
    })
  },
  {
    name: "Holiday Special",
    category: "holiday",
    templateType: "built_in",
    conversionRate: 3.9,
    config: JSON.stringify({
      title: "🎄 Holiday Special Offer",
      message: "Celebrate with 20% off your holiday shopping",
      discountCode: "HOLIDAY20",
      discountPercentage: 20,
      backgroundColor: "#228B22",
      textColor: "#ffffff",
      buttonColor: "#FFD700"
    })
  },
  {
    name: "Newsletter Signup",
    category: "newsletter",
    templateType: "built_in",
    conversionRate: 6.1,
    config: JSON.stringify({
      title: "Stay in the loop!",
      message: "Subscribe to our newsletter and get 15% off",
      discountCode: "NEWSLETTER15",
      discountPercentage: 15,
      backgroundColor: "#f8f9fa",
      textColor: "#333333",
      buttonColor: "#007bff"
    })
  }
];

// Initialize default templates for new shops
export async function initializeDefaultTemplates(shop) {
  try {
    for (const templateData of DEFAULT_TEMPLATES) {
      await prisma.popupTemplate.create({
        data: {
          shop,
          ...templateData,
          isFeatured: true
        }
      });
    }
  } catch (error) {
    console.error("Initialize default templates error:", error);
  }
}
