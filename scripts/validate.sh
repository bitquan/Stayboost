#!/bin/bash

# StayBoost Project Validation Script
# This script validates the entire StayBoost project setup

echo "🚀 StayBoost Project Validation Starting..."
echo "============================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
node --version

# Check npm version
echo "📋 Checking npm version..."
npm --version

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the StayBoost directory?"
    exit 1
fi

echo "✅ In correct project directory"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name validation

# Run smoke tests
echo "🧪 Running smoke tests..."
npm run test:smoke

if [ $? -eq 0 ]; then
    echo "✅ All smoke tests passed!"
else
    echo "❌ Some smoke tests failed!"
    exit 1
fi

# Try to build the project
echo "🏗️  Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Project built successfully!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Validate environment
echo "🔧 Validating environment..."

# Check if all critical files exist
CRITICAL_FILES=(
    "app/shopify.server.js"
    "app/db.server.js" 
    "app/models/popupSettings.server.js"
    "app/routes/app._index.jsx"
    "app/routes/api.stayboost.settings.jsx"
    "extensions/stayboost-theme/blocks/stayboost-popup.liquid"
    "extensions/stayboost-theme/assets/stayboost-popup.js"
    "prisma/schema.prisma"
    "shopify.app.toml"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check database
if [ -f "prisma/dev.sqlite" ]; then
    echo "✅ Database file exists"
else
    echo "❌ Database file missing"
    exit 1
fi

# Check if Prisma client is generated
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client not generated"
    exit 1
fi

echo ""
echo "🎉 StayBoost Project Validation Complete!"
echo "=========================================="
echo ""
echo "✅ All systems operational!"
echo "🚀 Ready to start development server with: npm run dev"
echo "🧪 Run tests anytime with: npm run test:smoke"
echo "🏗️  Build project with: npm run build"
echo ""
echo "📁 Project Structure:"
echo "   📂 app/                  - Main application code"
echo "   📂 extensions/           - Shopify theme extension"
echo "   📂 prisma/              - Database schema & migrations"
echo "   📂 tests/               - Test suite"
echo ""
echo "🔗 Key Integration Points:"
echo "   1. Admin Dashboard → Database → API"
echo "   2. Theme Extension → API → Popup Display"
echo "   3. Exit Intent Detection → Popup Trigger"
echo ""
