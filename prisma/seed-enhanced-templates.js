import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const enhancedTemplates = [
  // Spring Collection Templates
  {
    name: "Spring Renewal Sale",
    category: "seasonal_spring",
    config: JSON.stringify({
      title: "🌸 Spring Into Savings!",
      message: "Fresh styles, fresh savings! Get 25% off our new spring collection.",
      discountCode: "SPRING25",
      discountPercentage: 25,
      backgroundColor: "#E8F5E8",
      textColor: "#2D5016",
      buttonColor: "#68B168",
      borderRadius: 12,
      fontSize: 16,
      animation: "fadeIn",
      icon: "🌸"
    }),
    shop: "default",
    templateType: "built-in"
  },
  {
    name: "Easter Special",
    category: "seasonal_spring",
    config: JSON.stringify({
      title: "🐰 Easter Egg-straordinary Sale!",
      message: "Hop into spring with 20% off everything! Limited time Easter special.",
      discountCode: "EASTER20",
      discountPercentage: 20,
      backgroundColor: "#FFF8DC",
      textColor: "#8B4513",
      buttonColor: "#FFD700",
      borderRadius: 15,
      fontSize: 16,
      animation: "bounce",
      icon: "🐰"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Summer Sale Templates
  {
    name: "Summer Beach Vibes",
    category: "seasonal_summer",
    config: JSON.stringify({
      title: "☀️ Summer Beach Sale!",
      message: "Beat the heat with hot deals! Save 30% on summer essentials.",
      discountCode: "BEACH30",
      discountPercentage: 30,
      backgroundColor: "#87CEEB",
      textColor: "#191970",
      buttonColor: "#FFD700",
      borderRadius: 10,
      fontSize: 17,
      animation: "slideIn",
      icon: "☀️"
    }),
    shop: "default",
    templateType: "built-in"
  },
  {
    name: "Summer Clearance Blowout",
    category: "seasonal_summer",
    config: JSON.stringify({
      title: "🏖️ End of Summer Clearance!",
      message: "Last chance for summer savings! Up to 50% off selected items.",
      discountCode: "SUMMER50",
      discountPercentage: 50,
      backgroundColor: "#FFA07A",
      textColor: "#8B0000",
      buttonColor: "#FF6347",
      borderRadius: 8,
      fontSize: 16,
      animation: "pulse",
      icon: "🏖️"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Fall/Autumn Templates
  {
    name: "Autumn Harvest Sale",
    category: "seasonal_fall",
    config: JSON.stringify({
      title: "🍂 Fall Into Savings!",
      message: "Cozy up with autumn deals! 25% off fall collection starts now.",
      discountCode: "AUTUMN25",
      discountPercentage: 25,
      backgroundColor: "#DEB887",
      textColor: "#8B4513",
      buttonColor: "#D2691E",
      borderRadius: 12,
      fontSize: 16,
      animation: "fadeIn",
      icon: "🍂"
    }),
    shop: "default",
    templateType: "built-in"
  },
  {
    name: "Halloween Spooktacular",
    category: "seasonal_fall",
    config: JSON.stringify({
      title: "🎃 Spooktacular Savings!",
      message: "Don't let these deals disappear! Get 30% off before Halloween.",
      discountCode: "SPOOKY30",
      discountPercentage: 30,
      backgroundColor: "#2F1B14",
      textColor: "#FF6600",
      buttonColor: "#FF4500",
      borderRadius: 10,
      fontSize: 17,
      animation: "shake",
      icon: "🎃"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Winter Special Templates
  {
    name: "Winter Wonderland Sale",
    category: "seasonal_winter",
    config: JSON.stringify({
      title: "❄️ Winter Wonderland Sale!",
      message: "Warm up with cool savings! 35% off winter collection.",
      discountCode: "WINTER35",
      discountPercentage: 35,
      backgroundColor: "#F0F8FF",
      textColor: "#4682B4",
      buttonColor: "#1E90FF",
      borderRadius: 12,
      fontSize: 16,
      animation: "snowfall",
      icon: "❄️"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Black Friday Templates
  {
    name: "Black Friday Mega Sale",
    category: "event_black_friday",
    config: JSON.stringify({
      title: "🖤 BLACK FRIDAY MEGA SALE!",
      message: "The biggest sale of the year! Save up to 70% on everything!",
      discountCode: "BLACKFRI70",
      discountPercentage: 70,
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      buttonColor: "#FF0000",
      borderRadius: 8,
      fontSize: 18,
      animation: "flash",
      icon: "🖤"
    }),
    shop: "default",
    templateType: "built-in"
  },
  {
    name: "Black Friday Early Access",
    category: "event_black_friday",
    config: JSON.stringify({
      title: "🔥 Early Black Friday Access!",
      message: "VIP early access! Shop Black Friday deals before everyone else.",
      discountCode: "EARLY50",
      discountPercentage: 50,
      backgroundColor: "#1C1C1C",
      textColor: "#FFD700",
      buttonColor: "#FF6600",
      borderRadius: 10,
      fontSize: 17,
      animation: "glow",
      icon: "🔥"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Cyber Monday Templates
  {
    name: "Cyber Monday Digital Deals",
    category: "event_cyber_monday",
    config: JSON.stringify({
      title: "💻 CYBER MONDAY DEALS!",
      message: "Digital savings start now! 60% off tech and digital products.",
      discountCode: "CYBER60",
      discountPercentage: 60,
      backgroundColor: "#0000FF",
      textColor: "#00FFFF",
      buttonColor: "#00FF00",
      borderRadius: 6,
      fontSize: 16,
      animation: "matrix",
      icon: "💻"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Valentine's Day Templates
  {
    name: "Valentine's Love Sale",
    category: "event_valentines",
    config: JSON.stringify({
      title: "💕 Love is in the Air!",
      message: "Share the love with 25% off romantic gifts and more!",
      discountCode: "LOVE25",
      discountPercentage: 25,
      backgroundColor: "#FFB6C1",
      textColor: "#8B008B",
      buttonColor: "#FF1493",
      borderRadius: 15,
      fontSize: 16,
      animation: "heartbeat",
      icon: "💕"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Mother's Day Template
  {
    name: "Mother's Day Special",
    category: "event_mothers_day",
    config: JSON.stringify({
      title: "👩‍👧‍👦 Mom Deserves the Best!",
      message: "Show mom some love with 30% off gifts she'll treasure forever.",
      discountCode: "MOM30",
      discountPercentage: 30,
      backgroundColor: "#FFC0CB",
      textColor: "#8B008B",
      buttonColor: "#FF69B4",
      borderRadius: 12,
      fontSize: 16,
      animation: "gentle",
      icon: "👩‍👧‍👦"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Father's Day Template
  {
    name: "Father's Day Heroes",
    category: "event_fathers_day",
    config: JSON.stringify({
      title: "👨‍👧‍👦 Dad's Day Deals!",
      message: "Celebrate the hero in your life! 25% off gifts for dad.",
      discountCode: "DAD25",
      discountPercentage: 25,
      backgroundColor: "#4682B4",
      textColor: "#FFFFFF",
      buttonColor: "#1E90FF",
      borderRadius: 8,
      fontSize: 16,
      animation: "strong",
      icon: "👨‍👧‍👦"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Back to School Template
  {
    name: "Back to School Savings",
    category: "event_back_to_school",
    config: JSON.stringify({
      title: "📚 Back to School Sale!",
      message: "Get ready for the new school year! 20% off school essentials.",
      discountCode: "SCHOOL20",
      discountPercentage: 20,
      backgroundColor: "#FFFF99",
      textColor: "#000080",
      buttonColor: "#FF6347",
      borderRadius: 10,
      fontSize: 16,
      animation: "notebook",
      icon: "📚"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // New Year Template
  {
    name: "New Year New You",
    category: "event_new_year",
    config: JSON.stringify({
      title: "🎊 New Year, New Savings!",
      message: "Start the year right with 40% off everything! Limited time only.",
      discountCode: "NEWYEAR40",
      discountPercentage: 40,
      backgroundColor: "#FFD700",
      textColor: "#8B008B",
      buttonColor: "#FF6600",
      borderRadius: 12,
      fontSize: 17,
      animation: "confetti",
      icon: "🎊"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Birthday Special Template
  {
    name: "Birthday Celebration",
    category: "special_birthday",
    config: JSON.stringify({
      title: "🎂 Happy Birthday to You!",
      message: "It's your special day! Enjoy 25% off as our birthday gift to you.",
      discountCode: "BIRTHDAY25",
      discountPercentage: 25,
      backgroundColor: "#FFB6C1",
      textColor: "#8B008B",
      buttonColor: "#FF1493",
      borderRadius: 15,
      fontSize: 16,
      animation: "birthday",
      icon: "🎂"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Flash Sale Template
  {
    name: "Lightning Flash Sale",
    category: "special_flash_sale",
    config: JSON.stringify({
      title: "⚡ FLASH SALE ALERT!",
      message: "Lightning fast deals! 45% off for the next 2 hours only!",
      discountCode: "FLASH45",
      discountPercentage: 45,
      backgroundColor: "#FFFF00",
      textColor: "#FF0000",
      buttonColor: "#FF6600",
      borderRadius: 6,
      fontSize: 18,
      animation: "lightning",
      icon: "⚡"
    }),
    shop: "default",
    templateType: "built-in"
  },

  // Clearance Template
  {
    name: "Final Clearance Event",
    category: "special_clearance",
    config: JSON.stringify({
      title: "🏷️ FINAL CLEARANCE!",
      message: "Everything must go! Up to 80% off clearance items. Don't miss out!",
      discountCode: "CLEAR80",
      discountPercentage: 80,
      backgroundColor: "#FF4500",
      textColor: "#FFFFFF",
      buttonColor: "#8B0000",
      borderRadius: 8,
      fontSize: 17,
      animation: "urgent",
      icon: "🏷️"
    }),
    shop: "default",
    templateType: "built-in"
  }
];

async function seedEnhancedTemplates() {
  console.log('🌱 Seeding enhanced seasonal/event templates...');
  
  try {
    // Add enhanced templates
    for (const template of enhancedTemplates) {
      const existingTemplate = await prisma.popupTemplate.findFirst({
        where: {
          name: template.name,
          shop: template.shop
        }
      });

      if (!existingTemplate) {
        await prisma.popupTemplate.create({
          data: template
        });
        console.log(`✅ Created template: ${template.name} (${template.category})`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
      }
    }
    
    // Create initial usage stats for the new templates
    const templateCount = await prisma.popupTemplate.count({
      where: { shop: "default" }
    });
    
    console.log(`✅ Enhanced template seeding complete! Total templates: ${templateCount}`);
    console.log('📊 Categories enhanced with seasonal and event-based templates');
    
  } catch (error) {
    console.error('❌ Error seeding enhanced templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedEnhancedTemplates();
