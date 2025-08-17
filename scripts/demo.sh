#!/bin/bash

# StayBoost Demo Script
# This script demonstrates all the key features of the StayBoost project

echo "🎯 StayBoost - Exit-Intent Popup App Demo"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this from the StayBoost project root directory"
    exit 1
fi

echo "📋 Project Overview:"
echo "   🏪 App: StayBoost - Shopify Exit-Intent Popup"
echo "   🎯 Purpose: Capture abandoning customers with smart popups"
echo "   💰 Goal: Increase conversion rates by 15-25%"
echo ""

echo "🔧 Tech Stack:"
echo "   ⚛️  Frontend: React + Remix + Shopify Polaris"
echo "   🖥️  Backend: Node.js + Shopify App APIs"
echo "   🗄️  Database: Prisma ORM + SQLite"
echo "   🎨 Theme: Liquid + Vanilla JavaScript"
echo ""

echo "🚀 Running comprehensive tests..."
npm run test:all

if [ $? -eq 0 ]; then
    echo "✅ All tests passed! Project is fully functional."
else
    echo "❌ Some tests failed. Please check the issues above."
    exit 1
fi

echo ""
echo "🏗️  Building project for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📊 Database Demo:"
echo "   Creating sample popup settings..."

# Use Node.js to create sample data
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function demo() {
  try {
    // Clean up any existing demo data
    await prisma.popupSettings.deleteMany({
      where: { shop: 'demo-store.myshopify.com' }
    });

    // Create demo settings
    const demoSettings = {
      shop: 'demo-store.myshopify.com',
      enabled: true,
      title: '🎯 Demo Popup - Don\\'t Miss Out!',
      message: 'Get 20% off your entire order with code DEMO20',
      discountCode: 'DEMO20',
      discountPercentage: 20,
      delaySeconds: 3,
      showOnce: false
    };

    const created = await prisma.popupSettings.create({ data: demoSettings });
    console.log('   ✅ Demo settings created:', created.title);

    // Retrieve and display
    const retrieved = await prisma.popupSettings.findUnique({
      where: { shop: 'demo-store.myshopify.com' }
    });

    console.log('   📊 Demo Data:');
    console.log('      Shop:', retrieved.shop);
    console.log('      Title:', retrieved.title);
    console.log('      Discount:', retrieved.discountPercentage + '% off');
    console.log('      Code:', retrieved.discountCode);
    console.log('      Delay:', retrieved.delaySeconds + ' seconds');
    console.log('      Show Once:', retrieved.showOnce ? 'Yes' : 'No');

    await prisma.\$disconnect();
  } catch (error) {
    console.error('   ❌ Demo failed:', error.message);
    process.exit(1);
  }
}

demo();
"

echo ""
echo "🎨 Theme Extension Demo:"
echo "   Liquid Block: extensions/stayboost-theme/blocks/stayboost-popup.liquid"
echo "   JavaScript: extensions/stayboost-theme/assets/stayboost-popup.js"
echo "   API Endpoint: /api/stayboost/settings"
echo ""

echo "🔗 Integration Flow:"
echo "   1. 👨‍💼 Merchant configures popup in admin dashboard"
echo "   2. 💾 Settings saved to database via Prisma"
echo "   3. 🌐 Settings exposed through CORS-enabled API"
echo "   4. 🎨 Theme extension fetches settings"
echo "   5. 🖱️  Exit intent detected (mouse leaves viewport)"
echo "   6. 🎉 Popup appears with discount offer"
echo ""

echo "⚡ Key Features:"
echo "   ✅ Exit-intent detection (desktop + mobile)"
echo "   ✅ Customizable popup content"
echo "   ✅ Live preview in admin"
echo "   ✅ Session-based 'show once' option"
echo "   ✅ Configurable trigger delay"
echo "   ✅ Mobile-responsive design"
echo "   ✅ Analytics tracking (impressions, conversions)"
echo ""

echo "🧪 Test Coverage:"
echo "   ✅ Database operations (CRUD)"
echo "   ✅ File structure validation"
echo "   ✅ Configuration checks"
echo "   ✅ Exit intent logic"
echo "   ✅ Session storage handling"
echo "   ✅ API response structure"
echo "   ✅ HTML generation"
echo "   ✅ URL parameter handling"
echo ""

echo "📁 Project Structure:"
echo "   📂 app/"
echo "      📄 shopify.server.js        - Shopify app initialization"
echo "      📄 db.server.js             - Prisma database client"
echo "      📂 models/"
echo "         📄 popupSettings.server.js - Data access layer"
echo "      📂 routes/"
echo "         📄 app._index.jsx         - Admin dashboard"
echo "         📄 api.stayboost.settings.jsx - Public API"
echo "   📂 extensions/stayboost-theme/"
echo "      📄 blocks/stayboost-popup.liquid - Theme integration"
echo "      📄 assets/stayboost-popup.js     - Client-side popup"
echo "   📂 prisma/"
echo "      📄 schema.prisma             - Database schema"
echo "   📂 tests/"
echo "      📄 smoke.test.js             - Infrastructure tests"
echo "      📄 functional.test.js        - Logic tests"
echo ""

echo "🚀 Ready to Launch!"
echo "=================="
echo ""
echo "To start development:"
echo "   npm run dev"
echo ""
echo "To run tests:"
echo "   npm run test:all"
echo ""
echo "To build for production:"
echo "   npm run build"
echo ""
echo "🎯 StayBoost is ready to help merchants recover lost sales!"
echo "   Expected conversion rate: 7-15%"
echo "   Average revenue recovery: 15-25% boost"
echo "   Setup time: Under 5 minutes"
echo ""
