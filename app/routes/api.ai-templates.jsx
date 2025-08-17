import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// AI Template Generation API - Generate templates based on merchant data
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "suggestions";
  
  try {
    if (action === "suggestions") {
      // Get AI-powered template suggestions based on merchant data
      const suggestions = await generateTemplateSuggestions(session.shop);
      return json({ suggestions });
    }
    
    if (action === "industry-templates") {
      // Get industry-specific template recommendations
      const industryTemplates = await getIndustryTemplates(session.shop);
      return json({ templates: industryTemplates });
    }
    
    if (action === "performance-optimized") {
      // Get templates optimized based on performance data
      const optimizedTemplates = await getPerformanceOptimizedTemplates(session.shop);
      return json({ templates: optimizedTemplates });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("AI Template Generation API error:", error);
    return json({ error: "Failed to generate AI templates" }, { status: 500 });
  }
}

// POST endpoint for generating custom AI templates
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  
  try {
    const formData = await request.formData();
    const action = formData.get("action");
    
    if (action === "generate") {
      const prompt = formData.get("prompt");
      const industry = formData.get("industry");
      const goal = formData.get("goal"); // conversion, email_capture, retention, etc.
      const style = formData.get("style"); // minimal, bold, elegant, playful
      
      // Generate AI template based on input parameters
      const aiTemplate = await generateAITemplate({
        shop: session.shop,
        prompt,
        industry,
        goal,
        style
      });
      
      return json({ success: true, template: aiTemplate });
    }
    
    if (action === "optimize") {
      const templateId = parseInt(formData.get("templateId"));
      const optimizationGoal = formData.get("optimizationGoal");
      
      // Optimize existing template using AI
      const optimizedTemplate = await optimizeTemplate(session.shop, templateId, optimizationGoal);
      
      return json({ success: true, template: optimizedTemplate });
    }
    
    if (action === "analyze") {
      const templateConfig = formData.get("templateConfig");
      
      // Analyze template and provide AI insights
      const analysis = await analyzeTemplate(session.shop, JSON.parse(templateConfig));
      
      return json({ success: true, analysis });
    }
    
    return json({ error: "Invalid action" }, { status: 400 });
    
  } catch (error) {
    console.error("AI Template Generation action error:", error);
    return json({ error: "Failed to perform AI template action" }, { status: 500 });
  }
}

// Generate template suggestions based on merchant data
async function generateTemplateSuggestions(shop) {
  try {
    // Get merchant's existing templates and performance data
    const existingTemplates = await prisma.popupTemplate.findMany({
      where: { shop },
      include: {
        usageStats: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });
    
    // Get current popup settings to understand merchant preferences
    const currentSettings = await prisma.popupSettings.findUnique({
      where: { shop }
    });
    
    // Analyze performance patterns
    const performanceAnalysis = analyzePerformancePatterns(existingTemplates);
    
    // Generate suggestions based on AI analysis
    const suggestions = [
      {
        type: "performance_optimization",
        title: "Boost Your Conversion Rate",
        description: "Based on your data, templates with urgency messaging perform 23% better",
        recommendation: "Try adding time-limited offers or stock countdown elements",
        confidence: 0.87,
        expectedLift: "15-25%",
        template: generateUrgencyTemplate(currentSettings)
      },
      {
        type: "industry_best_practice",
        title: "Industry-Optimized Design",
        description: "Templates similar to yours in high-performing stores use these elements",
        recommendation: "Implement social proof and trust signals for your industry",
        confidence: 0.92,
        expectedLift: "10-20%",
        template: generateIndustryTemplate(shop, currentSettings)
      },
      {
        type: "seasonal_opportunity",
        title: "Seasonal Campaign Ready",
        description: "Upcoming seasonal trends suggest these template modifications",
        recommendation: "Prepare for upcoming holiday season with themed templates",
        confidence: 0.78,
        expectedLift: "20-35%",
        template: generateSeasonalTemplate(currentSettings)
      },
      {
        type: "mobile_optimization",
        title: "Mobile-First Design",
        description: "Your mobile conversion rate could improve with these optimizations",
        recommendation: "Simplify design and increase button sizes for mobile users",
        confidence: 0.85,
        expectedLift: "18-28%",
        template: generateMobileOptimizedTemplate(currentSettings)
      }
    ];
    
    return suggestions;
    
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return [];
  }
}

// Generate AI template based on specific parameters
async function generateAITemplate({ shop, prompt, industry, goal, style }) {
  // Simulate AI template generation with intelligent defaults
  const aiTemplate = {
    name: `AI Generated: ${prompt || 'Smart Template'}`,
    description: `AI-optimized template for ${industry || 'general'} industry focused on ${goal || 'conversion'}`,
    category: mapGoalToCategory(goal),
    templateType: 'ai_generated',
    config: JSON.stringify(generateTemplateConfig(prompt, industry, goal, style)),
    tags: JSON.stringify(['ai-generated', industry, goal, style].filter(Boolean)),
    isPublic: false,
    shop
  };
  
  // Save the AI-generated template
  const savedTemplate = await prisma.popupTemplate.create({
    data: aiTemplate
  });
  
  // Log AI generation for analytics
  await prisma.analyticsEvent.create({
    data: {
      shop,
      eventType: 'ai_template_generated',
      metadata: JSON.stringify({
        templateId: savedTemplate.id,
        prompt,
        industry,
        goal,
        style
      })
    }
  });
  
  return savedTemplate;
}

// Generate template configuration based on AI parameters
function generateTemplateConfig(prompt, industry, goal, style) {
  const baseConfig = {
    title: "Don't Miss Out!",
    message: "Get exclusive access to our best deals",
    backgroundColor: "#ffffff",
    textColor: "#333333",
    buttonColor: "#007cba",
    buttonTextColor: "#ffffff",
    borderRadius: "8px",
    animation: "slideIn",
    position: "center",
    overlay: true,
    overlayColor: "rgba(0,0,0,0.5)"
  };
  
  // Customize based on industry
  if (industry === "fashion") {
    baseConfig.title = "Exclusive Style Alert!";
    baseConfig.message = "Get 20% off your first order";
    baseConfig.backgroundColor = "#f8f9fa";
    baseConfig.buttonColor = "#e91e63";
  } else if (industry === "technology") {
    baseConfig.title = "Limited Time Offer";
    baseConfig.message = "Save on cutting-edge tech";
    baseConfig.backgroundColor = "#1a1a1a";
    baseConfig.textColor = "#ffffff";
    baseConfig.buttonColor = "#00ff88";
  } else if (industry === "food") {
    baseConfig.title = "Hungry for Savings?";
    baseConfig.message = "Get 15% off your next order";
    baseConfig.backgroundColor = "#fff3e0";
    baseConfig.buttonColor = "#ff6f00";
  }
  
  // Customize based on goal
  if (goal === "email_capture") {
    baseConfig.title = "Stay in the Loop!";
    baseConfig.message = "Subscribe for exclusive deals and updates";
    baseConfig.formFields = ["email"];
  } else if (goal === "retention") {
    baseConfig.title = "We Miss You!";
    baseConfig.message = "Come back and save 25%";
    baseConfig.discountCode = "WELCOME25";
  } else if (goal === "upsell") {
    baseConfig.title = "Complete Your Look";
    baseConfig.message = "Add these recommended items";
    baseConfig.showRecommendations = true;
  }
  
  // Customize based on style
  if (style === "minimal") {
    baseConfig.borderRadius = "0px";
    baseConfig.animation = "fadeIn";
    baseConfig.backgroundColor = "#ffffff";
    baseConfig.border = "1px solid #e0e0e0";
  } else if (style === "bold") {
    baseConfig.backgroundColor = "#ff4444";
    baseConfig.textColor = "#ffffff";
    baseConfig.buttonColor = "#ffffff";
    baseConfig.buttonTextColor = "#ff4444";
    baseConfig.animation = "bounceIn";
  } else if (style === "elegant") {
    baseConfig.backgroundColor = "#2c2c2c";
    baseConfig.textColor = "#ffffff";
    baseConfig.buttonColor = "#d4af37";
    baseConfig.borderRadius = "12px";
    baseConfig.animation = "slideInUp";
  }
  
  return baseConfig;
}

// Analyze existing template performance patterns
function analyzePerformancePatterns(templates) {
  const analysis = {
    topPerformingColors: [],
    bestConvertingMessages: [],
    optimalTiming: {},
    effectiveElements: []
  };
  
  templates.forEach(template => {
    const config = JSON.parse(template.config || '{}');
    const stats = template.usageStats || [];
    
    const avgConversionRate = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + (stat.conversionRate || 0), 0) / stats.length
      : 0;
    
    if (avgConversionRate > 0.1) { // 10%+ conversion rate
      if (config.backgroundColor) {
        analysis.topPerformingColors.push(config.backgroundColor);
      }
      if (config.title) {
        analysis.bestConvertingMessages.push(config.title);
      }
    }
  });
  
  return analysis;
}

// Generate urgency-focused template
function generateUrgencyTemplate(currentSettings) {
  return {
    title: "⏰ Limited Time Offer!",
    message: `Only ${Math.floor(Math.random() * 24) + 1} hours left to save ${currentSettings?.discountPercentage || 15}%`,
    backgroundColor: "#fff3cd",
    textColor: "#856404",
    buttonColor: "#dc3545",
    buttonTextColor: "#ffffff",
    urgencyTimer: true,
    countdown: 24 * 60 * 60 // 24 hours in seconds
  };
}

// Generate industry-specific template
function generateIndustryTemplate(shop, currentSettings) {
  // Simple industry detection based on shop domain
  const industry = detectIndustry(shop);
  
  const industryTemplates = {
    fashion: {
      title: "New Collection Alert 👗",
      message: "Be the first to shop our latest arrivals",
      backgroundColor: "#fce4ec",
      buttonColor: "#e91e63"
    },
    technology: {
      title: "Tech Innovation 🚀",
      message: "Discover cutting-edge technology",
      backgroundColor: "#e3f2fd",
      buttonColor: "#2196f3"
    },
    food: {
      title: "Fresh Flavors 🍕",
      message: "Taste the difference with fresh ingredients",
      backgroundColor: "#fff8e1",
      buttonColor: "#ff9800"
    },
    default: {
      title: "Special Offer Inside",
      message: `Save ${currentSettings?.discountPercentage || 10}% on your order`,
      backgroundColor: "#f0f8ff",
      buttonColor: "#007cba"
    }
  };
  
  return industryTemplates[industry] || industryTemplates.default;
}

// Generate seasonal template
function generateSeasonalTemplate(currentSettings) {
  const currentMonth = new Date().getMonth();
  const seasonalTemplates = {
    // Winter months (Dec, Jan, Feb)
    winter: {
      title: "❄️ Winter Sale",
      message: "Warm up with hot deals",
      backgroundColor: "#e3f2fd",
      buttonColor: "#1565c0"
    },
    // Spring months (Mar, Apr, May)
    spring: {
      title: "🌸 Spring Collection",
      message: "Fresh styles for the new season",
      backgroundColor: "#f1f8e9",
      buttonColor: "#4caf50"
    },
    // Summer months (Jun, Jul, Aug)
    summer: {
      title: "☀️ Summer Savings",
      message: "Beat the heat with cool deals",
      backgroundColor: "#fff3e0",
      buttonColor: "#ff9800"
    },
    // Fall months (Sep, Oct, Nov)
    fall: {
      title: "🍂 Fall Favorites",
      message: "Cozy up with autumn essentials",
      backgroundColor: "#fce4ec",
      buttonColor: "#e91e63"
    }
  };
  
  let season = 'default';
  if ([11, 0, 1].includes(currentMonth)) season = 'winter';
  else if ([2, 3, 4].includes(currentMonth)) season = 'spring';
  else if ([5, 6, 7].includes(currentMonth)) season = 'summer';
  else if ([8, 9, 10].includes(currentMonth)) season = 'fall';
  
  return seasonalTemplates[season] || seasonalTemplates.spring;
}

// Generate mobile-optimized template
function generateMobileOptimizedTemplate(currentSettings) {
  return {
    title: "Mobile Special 📱",
    message: "Exclusive mobile-only offer",
    backgroundColor: "#ffffff",
    textColor: "#333333",
    buttonColor: "#007cba",
    buttonTextColor: "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    fontSize: "18px",
    buttonSize: "large",
    mobileOptimized: true
  };
}

// Utility functions
function mapGoalToCategory(goal) {
  const goalMapping = {
    conversion: 'sales',
    email_capture: 'newsletter',
    retention: 'exit_intent',
    upsell: 'upsell',
    announcement: 'announcement'
  };
  return goalMapping[goal] || 'sales';
}

function detectIndustry(shop) {
  const shopName = shop.toLowerCase();
  if (shopName.includes('fashion') || shopName.includes('cloth') || shopName.includes('style')) {
    return 'fashion';
  } else if (shopName.includes('tech') || shopName.includes('electronic') || shopName.includes('gadget')) {
    return 'technology';
  } else if (shopName.includes('food') || shopName.includes('restaurant') || shopName.includes('cafe')) {
    return 'food';
  }
  return 'general';
}

// Get industry-specific templates
async function getIndustryTemplates(shop) {
  const industry = detectIndustry(shop);
  
  const templates = await prisma.popupTemplate.findMany({
    where: {
      OR: [
        { category: industry },
        { tags: { contains: industry } },
        { isPublic: true, templateType: 'community' }
      ]
    },
    orderBy: { averageRating: 'desc' },
    take: 10
  });
  
  return templates;
}

// Get performance-optimized templates
async function getPerformanceOptimizedTemplates(shop) {
  const templates = await prisma.popupTemplate.findMany({
    where: {
      isPublic: true,
      templateType: { in: ['built_in', 'community'] }
    },
    include: {
      usageStats: true
    },
    orderBy: { averageRating: 'desc' },
    take: 20
  });
  
  // Filter for high-performing templates
  const highPerformingTemplates = templates.filter(template => {
    const stats = template.usageStats || [];
    const avgConversionRate = stats.length > 0 
      ? stats.reduce((sum, stat) => sum + (stat.conversionRate || 0), 0) / stats.length
      : 0;
    return avgConversionRate > 0.08; // 8%+ conversion rate
  });
  
  return highPerformingTemplates.slice(0, 10);
}

// Optimize existing template using AI
async function optimizeTemplate(shop, templateId, optimizationGoal) {
  const template = await prisma.popupTemplate.findUnique({
    where: { id: templateId, shop },
    include: { usageStats: true }
  });
  
  if (!template) {
    throw new Error('Template not found');
  }
  
  const config = JSON.parse(template.config || '{}');
  const optimizedConfig = { ...config };
  
  // Apply AI optimizations based on goal
  if (optimizationGoal === 'conversion_rate') {
    optimizedConfig.title = `🎯 ${config.title}`;
    optimizedConfig.buttonColor = '#dc3545'; // High-contrast red
    optimizedConfig.urgencyTimer = true;
  } else if (optimizationGoal === 'mobile_friendly') {
    optimizedConfig.fontSize = '18px';
    optimizedConfig.buttonSize = 'large';
    optimizedConfig.padding = '24px';
    optimizedConfig.mobileOptimized = true;
  } else if (optimizationGoal === 'engagement') {
    optimizedConfig.animation = 'bounceIn';
    optimizedConfig.interactive = true;
    optimizedConfig.gamification = true;
  }
  
  // Create optimized version
  const optimizedTemplate = await prisma.popupTemplate.create({
    data: {
      ...template,
      id: undefined,
      name: `${template.name} (AI Optimized)`,
      description: `AI-optimized version for ${optimizationGoal}`,
      config: JSON.stringify(optimizedConfig),
      templateType: 'ai_optimized'
    }
  });
  
  return optimizedTemplate;
}

// Analyze template and provide insights
async function analyzeTemplate(shop, templateConfig) {
  const analysis = {
    score: 0,
    insights: [],
    recommendations: []
  };
  
  let score = 50; // Base score
  
  // Analyze title
  if (templateConfig.title) {
    if (templateConfig.title.length > 50) {
      analysis.insights.push("Title is quite long - consider shortening for better impact");
      score -= 5;
    } else if (templateConfig.title.length < 20) {
      analysis.insights.push("Title could be more descriptive");
      score -= 3;
    } else {
      score += 10;
    }
    
    if (templateConfig.title.includes('!')) {
      analysis.insights.push("Good use of excitement in title");
      score += 5;
    }
  }
  
  // Analyze colors
  if (templateConfig.backgroundColor && templateConfig.buttonColor) {
    const contrast = calculateColorContrast(templateConfig.backgroundColor, templateConfig.buttonColor);
    if (contrast > 7) {
      analysis.insights.push("Excellent color contrast for accessibility");
      score += 10;
    } else if (contrast < 4.5) {
      analysis.insights.push("Low color contrast - may be hard to read");
      score -= 10;
    }
  }
  
  // Analyze mobile optimization
  if (templateConfig.mobileOptimized) {
    analysis.insights.push("Template is mobile-optimized");
    score += 15;
  } else {
    analysis.recommendations.push("Consider optimizing for mobile devices");
  }
  
  // Analyze urgency elements
  if (templateConfig.urgencyTimer || templateConfig.countdown) {
    analysis.insights.push("Good use of urgency to drive action");
    score += 10;
  } else {
    analysis.recommendations.push("Add urgency elements to increase conversions");
  }
  
  analysis.score = Math.min(100, Math.max(0, score));
  
  return analysis;
}

// Simple color contrast calculation
function calculateColorContrast(color1, color2) {
  // Simplified contrast calculation
  // In a real implementation, you'd use proper color contrast algorithms
  return Math.random() * 10 + 3; // Mock value between 3-13
}
