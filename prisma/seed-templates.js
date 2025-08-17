import prisma from "../app/db.server.js";

const DEFAULT_TEMPLATES = [
  {
    name: "Classic Exit Intent",
    category: "exit_intent",
    description: "A classic exit intent popup to capture leaving visitors",
    config: JSON.stringify({
      title: "Wait! Don't leave yet!",
      message: "Get 10% off your first order before you go",
      discountCode: "SAVE10",
      discountPercentage: 10,
      backgroundColor: "#ffffff",
      textColor: "#333333",
      buttonColor: "#5c6ac4",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Flash Sale Alert",
    category: "sale",
    description: "High-energy flash sale popup for urgent promotions",
    config: JSON.stringify({
      title: "⚡ 24-Hour Flash Sale!",
      message: "Save 25% on everything - Limited time only!",
      discountCode: "FLASH25",
      discountPercentage: 25,
      backgroundColor: "#ff6b6b",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "18px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Holiday Special",
    category: "holiday",
    description: "Festive holiday-themed popup for seasonal promotions",
    config: JSON.stringify({
      title: "🎄 Holiday Special Offer",
      message: "Celebrate with 20% off your holiday shopping",
      discountCode: "HOLIDAY20",
      discountPercentage: 20,
      backgroundColor: "#228B22",
      textColor: "#ffffff",
      buttonColor: "#FFD700",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Newsletter Signup",
    category: "newsletter",
    description: "Clean and simple newsletter subscription popup",
    config: JSON.stringify({
      title: "Stay in the loop!",
      message: "Subscribe to our newsletter and get 15% off",
      discountCode: "NEWSLETTER15",
      discountPercentage: 15,
      backgroundColor: "#f8f9fa",
      textColor: "#333333",
      buttonColor: "#007bff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Last Chance Sale",
    category: "sale",
    description: "Urgent last chance popup with countdown urgency",
    config: JSON.stringify({
      title: "Last Chance!",
      message: "This sale ends in 2 hours - Don't miss out!",
      discountCode: "LASTCHANCE",
      discountPercentage: 30,
      backgroundColor: "#dc3545",
      textColor: "#ffffff",
      buttonColor: "#ffc107",
      fontSize: "17px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "First Time Visitor",
    category: "exit_intent",
    description: "Welcome popup specifically for new visitors",
    config: JSON.stringify({
      title: "Welcome to our store!",
      message: "New here? Get 15% off your first purchase",
      discountCode: "WELCOME15",
      discountPercentage: 15,
      backgroundColor: "#e3f2fd",
      textColor: "#1976d2",
      buttonColor: "#1976d2",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Free Shipping Offer",
    category: "sale",
    description: "Free shipping promotion without minimum purchase",
    config: JSON.stringify({
      title: "🚚 Free Shipping Today!",
      message: "No minimum purchase required - Just for you!",
      discountCode: "FREESHIP",
      discountPercentage: 0,
      backgroundColor: "#4CAF50",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "12px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "VIP Early Access",
    category: "sale",
    description: "Exclusive VIP early access popup for premium customers",
    config: JSON.stringify({
      title: "🌟 VIP Early Access",
      message: "Get 30% off before everyone else",
      discountCode: "VIP30",
      discountPercentage: 30,
      backgroundColor: "#8e24aa",
      textColor: "#ffffff",
      buttonColor: "#FFD700",
      fontSize: "17px",
      borderRadius: "10px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Cart Abandonment",
    category: "exit_intent",
    description: "Recover abandoned carts with incentive offers",
    config: JSON.stringify({
      title: "Forgot something?",
      message: "Your items are waiting! Complete your order now",
      discountCode: "COMPLETE10",
      discountPercentage: 10,
      backgroundColor: "#ff9800",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Student Discount",
    category: "sale",
    description: "Special student discount verification popup",
    config: JSON.stringify({
      title: "📚 Student Special",
      message: "Verify your student status and save 20%",
      discountCode: "STUDENT20",
      discountPercentage: 20,
      backgroundColor: "#2196f3",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Birthday Special",
    category: "holiday",
    description: "Personalized birthday celebration popup",
    config: JSON.stringify({
      title: "🎂 Happy Birthday!",
      message: "Celebrate with a special 25% birthday discount",
      discountCode: "BIRTHDAY25",
      discountPercentage: 25,
      backgroundColor: "#ff69b4",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "17px",
      borderRadius: "15px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Back in Stock",
    category: "newsletter",
    description: "Notify customers when popular items are back",
    config: JSON.stringify({
      title: "🔥 Back in Stock!",
      message: "Your favorite items are available again",
      discountCode: "BACKSTOCK15",
      discountPercentage: 15,
      backgroundColor: "#ff5722",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Weekend Sale",
    category: "sale",
    description: "Relaxed weekend shopping promotion",
    config: JSON.stringify({
      title: "🏖️ Weekend Vibes",
      message: "Relax and save 20% this weekend only",
      discountCode: "WEEKEND20",
      discountPercentage: 20,
      backgroundColor: "#00bcd4",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Loyalty Reward",
    category: "exit_intent",
    description: "Reward loyal customers with exclusive discounts",
    config: JSON.stringify({
      title: "Thank you for your loyalty!",
      message: "Here's a special 35% discount just for you",
      discountCode: "LOYAL35",
      discountPercentage: 35,
      backgroundColor: "#9c27b0",
      textColor: "#ffffff",
      buttonColor: "#FFD700",
      fontSize: "17px",
      borderRadius: "10px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Summer Collection",
    category: "holiday",
    description: "Bright summer-themed promotional popup",
    config: JSON.stringify({
      title: "☀️ Summer Collection",
      message: "Beat the heat with 30% off summer essentials",
      discountCode: "SUMMER30",
      discountPercentage: 30,
      backgroundColor: "#ffeb3b",
      textColor: "#333333",
      buttonColor: "#ff5722",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Midnight Sale",
    category: "sale",
    description: "Late-night shopping promotion for night owls",
    config: JSON.stringify({
      title: "🌙 Midnight Madness",
      message: "Can't sleep? Save 40% until 6 AM",
      discountCode: "MIDNIGHT40",
      discountPercentage: 40,
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      buttonColor: "#ff6b6b",
      fontSize: "18px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Review Incentive",
    category: "newsletter",
    description: "Encourage customers to leave reviews",
    config: JSON.stringify({
      title: "📝 Share Your Experience",
      message: "Leave a review and get 10% off your next order",
      discountCode: "REVIEW10",
      discountPercentage: 10,
      backgroundColor: "#4caf50",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "New Arrival Alert",
    category: "newsletter",
    description: "Announce new product arrivals",
    config: JSON.stringify({
      title: "✨ Fresh Arrivals",
      message: "Be the first to shop our newest collection",
      discountCode: "NEWARRIVAL15",
      discountPercentage: 15,
      backgroundColor: "#e91e63",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Referral Bonus",
    category: "exit_intent",
    description: "Encourage customer referrals with rewards",
    config: JSON.stringify({
      title: "💕 Share the Love",
      message: "Refer a friend and both get 20% off",
      discountCode: "REFER20",
      discountPercentage: 20,
      backgroundColor: "#ff9800",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Black Friday Preview",
    category: "holiday",
    description: "Early Black Friday access for VIP customers",
    config: JSON.stringify({
      title: "🖤 Black Friday Preview",
      message: "Get early access to our biggest sale",
      discountCode: "BFPREVIEW50",
      discountPercentage: 50,
      backgroundColor: "#000000",
      textColor: "#ffffff",
      buttonColor: "#ff6b6b",
      fontSize: "18px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Spring Cleaning",
    category: "holiday",
    description: "Fresh spring cleaning sale promotion",
    config: JSON.stringify({
      title: "🌸 Spring Cleaning Sale",
      message: "Fresh start with 25% off everything",
      discountCode: "SPRING25",
      discountPercentage: 25,
      backgroundColor: "#8bc34a",
      textColor: "#ffffff",
      buttonColor: "#ffffff",
      fontSize: "16px",
      borderRadius: "8px"
    }),
    templateType: "built_in",
    shop: "default"
  },
  {
    name: "Premium Membership",
    category: "newsletter",
    description: "Promote premium membership benefits",
    config: JSON.stringify({
      title: "👑 Join Premium",
      message: "Unlock exclusive deals and free shipping",
      discountCode: "PREMIUM30",
      discountPercentage: 30,
      backgroundColor: "#795548",
      textColor: "#ffffff",
      buttonColor: "#FFD700",
      fontSize: "17px",
      borderRadius: "10px"
    }),
    templateType: "built_in",
    shop: "default"
  }
];

async function seedTemplates() {
  try {
    console.log("🌱 Starting template seeding process...");
    
    // Check if templates already exist (excluding the test one)
    const existingTemplates = await prisma.popupTemplate.count({
      where: { 
        shop: "default",
        name: { not: "Test Exit Intent" }
      }
    });
    
    console.log(`📊 Found ${existingTemplates} existing default templates`);
    
    if (existingTemplates > 0) {
      console.log(`✅ Default templates already exist (${existingTemplates} found), skipping`);
      return;
    }
    
    console.log("🚀 Creating 22 new templates...");
    
    // Create default templates
    const created = await prisma.popupTemplate.createMany({
      data: DEFAULT_TEMPLATES
    });
    
    console.log(`✅ Successfully created ${created.count} templates!`);
    
    console.log(`✅ Created ${created.count} default templates`);
    
    // Create some mock usage stats for templates
    const templates = await prisma.popupTemplate.findMany({
      where: { shop: "default" }
    });
    
    for (const template of templates) {
      await prisma.templateUsageStats.create({
        data: {
          templateId: template.id,
          shop: "default",
          date: new Date(),
          impressions: Math.floor(Math.random() * 1000) + 100,
          conversions: Math.floor(Math.random() * 50) + 5,
          conversionRate: parseFloat((Math.random() * 6 + 2).toFixed(1))
        }
      });
    }
    
    console.log("✅ Templates seeded successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    throw error;
  }
}

// Run seeder directly
console.log("🌱 Starting template seeding process...");
seedTemplates()
  .then(() => {
    console.log("🎉 Template seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Template seeding failed:", error);
    process.exit(1);
  });

export { DEFAULT_TEMPLATES, seedTemplates };

