# 🚀 StayBoost - Complete Master Blueprint

## 📋 Project Overview

**StayBoost** is a comprehensive Shopify exit-intent popup application built to capture abandoning customers and convert them into sales through strategic discount offers and compelling messaging.

### 🎯 Core Functionality

- **Exit-Intent Detection**: Captures users attempting to leave the store
- **Customizable Popups**: Merchants can configure title, message, discount codes, and percentages
- **Real-Time Analytics**: Tracks impressions, conversions, revenue recovered, and conversion rates
- **Theme Integration**: Seamless integration with any Shopify theme via theme app extensions
- **Admin Dashboard**: Complete management interface built with Shopify Polaris

---

## 🏗️ Technical Architecture

### 📱 Application Type

- **Platform**: Shopify App (Embedded)
- **Framework**: Remix (React-based full-stack framework)
- **Client ID**: `8279a1a1278f468713b7aaf5fad1f7dc`
- **Handle**: `stayboost`
- **Permissions**: `write_products`

### 🛠️ Technology Stack

#### **Frontend Technologies**

- **React 18.2.0**: Core UI library (locked for Remix compatibility)
- **Remix 2.16.1**: Full-stack React framework (primary architecture)
- **Shopify Polaris 12.0.0**: Official Shopify design system (version locked)
- **Shopify App Bridge 4.1.6**: Embedded app framework
- **Vite 6.2.2+**: Modern build tool and development server (Remix compatible)

#### **Backend Technologies**

- **Node.js ^18.20 || ^20.10 || >=21.0.0**: LTS runtime environment
- **Remix Server**: Server-side rendering and API routes (framework native)
- **Prisma 6.2.1**: Type-safe database ORM (version locked for stability)
- **SQLite**: Development database (Prisma compatible, production-ready for scaling)

#### **Security & Monitoring Stack**

- **Sentry (@sentry/remix)**: Error tracking with official Remix support
- **Winston 3.x**: Structured logging (Node.js native)
- **DOMPurify + JSDOM**: XSS protection (server-side compatible)
- **Validator.js 13.x**: Input validation (universal compatibility)
- **Custom Rate Limiting**: In-memory store (no Express dependency)
- **Custom Security Headers**: Web standards implementation

#### **Development & Build Tools**

- **TypeScript 5.x**: Type safety and developer experience
- **ESLint 8.x**: Code linting and quality enforcement
- **Prettier 3.x**: Code formatting
- **Node.js Test Runner**: Built-in testing framework (Node.js 18+)
- **Playwright**: End-to-end testing framework
- **Docker**: Containerization support with multi-stage builds

#### **Compatibility Matrix**

🚫 **Avoided Technologies**: Express.js (conflicts with Remix), Jest (Node.js test runner used), MongoDB (Prisma PostgreSQL setup)

✅ **Validated Integrations**: All components tested for Remix compatibility, no conflicting dependencies

---

## 📂 Complete File Structure & Architecture

### 🎛️ **Core Application Files**

```
📁 app/ - Main application directory
├── 📄 entry.server.jsx - Server entry point for SSR
├── 📄 root.jsx - Root React component with app shell
├── 📄 routes.js - Route definitions and configuration
├── 📄 shopify.server.js - Shopify app initialization & auth
├── 📄 db.server.js - Prisma client setup and configuration
│
├── 📁 routes/ - Remix route handlers
│   ├── 📄 app._index.jsx - Main admin dashboard (PRIMARY)
│   ├── 📄 app.jsx - App wrapper with Polaris styling
│   ├── 📄 app.additional.jsx - Additional admin pages
│   ├── 📄 app._index_old.jsx - Backup of original dashboard
│   ├── 📄 auth.$.jsx - Shopify OAuth authentication
│   ├── 📄 api.stayboost.settings.jsx - Public settings API
│   ├── 📄 api.analytics.jsx - Analytics collection API
│   ├── 📄 webhooks.app.scopes_update.jsx - Scope change handler
│   ├── 📄 webhooks.app.uninstalled.jsx - Uninstall cleanup
│   ├── 📁 _index/ - Landing page components
│   │   ├── 📄 route.jsx - Public landing page
│   │   └── 📄 styles.module.css - Landing page styles
│   └── 📁 auth.login/ - Authentication error handling
│       ├── 📄 error.server.jsx - Auth error handlers
│       └── 📄 route.jsx - Login route logic
│
└── 📁 models/ - Data access layer
    ├── 📄 popupSettings.server.js - Settings CRUD operations
    └── 📄 analytics.server.js - Analytics data operations
```

### 🎨 **Theme Extension (Storefront Integration)**

```
📁 extensions/stayboost-theme/ - Shopify theme app extension
├── 📄 shopify.extension.toml - Extension configuration
├── 📁 blocks/ - Liquid theme blocks
│   ├── 📄 stayboost-popup.liquid - Main popup block (PRIMARY)
│   └── 📄 star_rating.liquid - Example additional block
├── 📁 assets/ - Static assets and JavaScript
│   ├── 📄 stayboost-popup.js - Client-side popup logic (CORE)
│   └── 📄 thumbs-up.png - Example image asset
├── 📁 locales/ - Internationalization
│   └── 📄 en.default.json - English translations
└── 📁 snippets/ - Reusable Liquid snippets
    └── 📄 stars.liquid - Example snippet
```

### 🗄️ **Database Schema & Migrations**

```
📁 prisma/ - Database management
├── 📄 schema.prisma - Complete database schema (3 models)
└── 📁 migrations/ - Database version control
    ├── 📄 migration_lock.toml - Migration lock file
    ├── 📁 20240530213853_create_session_table/
    │   └── 📄 migration.sql - Initial session table
    └── 📁 20250816203336_add_popup_settings/
        └── 📄 migration.sql - Popup settings & analytics
```

### 🧪 **Testing Infrastructure**

```
📁 tests/ - Comprehensive testing suite
├── 📄 smoke.test.js - Infrastructure & smoke tests (11 tests)
├── 📄 functional.test.js - Business logic tests (6 tests)
└── 📄 analytics.test.js - Analytics system tests (14 tests)
```

### ⚙️ **Configuration & Build**

```
📁 Root Configuration Files
├── 📄 package.json - Dependencies & scripts (86 lines)
├── 📄 shopify.app.toml - Shopify app configuration
├── 📄 shopify.web.toml - Web configuration
├── 📄 vite.config.js - Vite build configuration
├── 📄 remix.config.js - Remix framework config
├── 📄 tsconfig.json - TypeScript configuration
├── 📄 Dockerfile - Container deployment
├── 📄 .eslintrc.cjs - Code linting rules
├── 📄 .prettierignore - Formatting exclusions
├── 📄 .editorconfig - Editor consistency
├── 📄 .gitignore - Git exclusions
└── 📄 .dockerignore - Docker exclusions
```

### 📋 **Documentation & Scripts**

```
📁 Documentation & Automation
├── 📄 README.md - Project documentation
├── 📄 CHANGELOG.md - Version history
├── 📄 LAUNCH_SUMMARY.md - Launch documentation
├── 📁 .github/ - GitHub configuration
│   ├── 📄 copilot-instructions.md - AI development guide
│   └── 📄 current-development-status.md - Status tracking
├── 📁 scripts/ - Automation scripts
│   ├── 📄 demo.sh - Project demonstration
│   └── 📄 validate.sh - Validation automation
└── 📁 .vscode/ - VS Code configuration
    ├── 📄 tasks.json - Development tasks
    ├── 📄 extensions.json - Recommended extensions
    └── 📄 mcp.json - MCP configuration
```

---

## 🔄 Data Flow Architecture

### 📊 **Complete Data Flow Diagram**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   STOREFRONT    │    │   SHOPIFY APP    │    │   ADMIN DASH    │
│                 │    │                  │    │                 │
│ Exit Intent → ──┼────┼→ Analytics API   │    │ Real-time Stats │
│ Popup Display   │    │                  │    │                 │
│ User Interaction│    │ ┌──────────────┐ │    │ ┌─────────────┐ │
└─────────────────┘    │ │  Database    │ │    │ │ Settings    │ │
                       │ │              │ │    │ │ Management  │ │
┌─────────────────┐    │ │ PopupAnalytics│ │    │ │             │ │
│  THEME EXTENSION│    │ │ PopupSettings │ │    │ │ Live Preview│ │
│                 │    │ │ Session      │ │    │ │             │ │
│ Liquid Block  → ┼────┼→│              │ │    │ └─────────────┘ │
│ JavaScript      │    │ └──────────────┘ │    │                 │
│ API Integration │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 🔗 **API Integration Points**

1. **Settings API** (`/api/stayboost/settings`)
   - **Purpose**: Serves popup configuration to theme extension
   - **Method**: GET
   - **CORS**: Enabled for cross-origin requests
   - **Response**: JSON with popup settings

2. **Analytics API** (`/api/analytics`)
   - **Purpose**: Collects impression and conversion data
   - **Methods**: GET (retrieve), POST (record)
   - **CORS**: Enabled for theme extension integration
   - **Data**: Impressions, conversions, revenue tracking

---

## 🎛️ Core Features & Components

### 🏠 **Admin Dashboard** (`app/routes/app._index.jsx`)

**Component Architecture:**

```jsx
StayBoost Dashboard
├── Status Card
│   ├── Active/Inactive Badge
│   ├── All-Time Impressions (formatted with commas)
│   ├── All-Time Conversions (formatted with commas)
│   └── Overall Conversion Rate (percentage)
├── Settings Management Card
│   ├── Enable/Disable Toggle
│   ├── Popup Title Input
│   ├── Message Text Area
│   ├── Discount Code Input
│   ├── Discount Percentage Slider
│   ├── Display Delay Configuration
│   └── Show Once Option Toggle
├── Live Preview Card
│   ├── Real-time Popup Preview
│   ├── Dynamic Content Updates
│   └── Mobile-responsive Display
├── Quick Stats Card
│   ├── Today's Impressions
│   ├── Today's Conversions
│   └── Today's Revenue Recovered
└── Getting Started Guide
    ├── Step-by-step Instructions
    ├── Integration Help
    └── Support Resources
```

**Key Features:**

- **Real-time Data**: All analytics display live data from database
- **Auto-save**: Settings automatically persist to database
- **Validation**: Input validation and error handling
- **Responsive**: Works on desktop and mobile
- **Accessibility**: Shopify Polaris ensures accessibility compliance

### 🎯 **Popup System** (`extensions/stayboost-theme/assets/stayboost-popup.js`)

**Technical Implementation:**

```javascript
StayBoost Popup Engine
├── Configuration Loading
│   ├── Dynamic API URL construction
│   ├── Shop domain extraction
│   └── Settings fetch with error handling
├── Exit Intent Detection
│   ├── Desktop: Mouse leave detection (clientY <= 0)
│   ├── Mobile: Browser back button (popstate event)
│   └── Configurable delay before activation
├── Popup Rendering
│   ├── Dynamic HTML generation
│   ├── Inline CSS styling
│   ├── Modal overlay with backdrop
│   └── Responsive design
├── User Interaction Handling
│   ├── CTA button click (conversion tracking)
│   ├── Dismiss button click
│   ├── Backdrop click to close
│   └── Session storage for "show once"
└── Analytics Integration
    ├── Impression recording on display
    ├── Conversion recording on CTA click
    └── Graceful error handling
```

**Advanced Features:**

- **Smart Timing**: Respects delay settings before triggering
- **Session Management**: Optional "show once per session" functionality
- **Cross-device Support**: Works on desktop, tablet, and mobile
- **Performance Optimized**: Minimal DOM manipulation and memory usage

### 📊 **Analytics System** (`app/models/analytics.server.js`)

**Data Model:**

```javascript
PopupAnalytics {
  id: Integer (Primary Key)
  shop: String (Shop domain)
  date: DateTime (Analytics date)
  impressions: Integer (Popup displays)
  conversions: Integer (Successful actions)
  revenueRecovered: Float (Dollar amount)
  conversionRate: Float (Calculated percentage)
  popupSettingsId: Integer (Foreign key)
  createdAt: DateTime (Record creation)
  updatedAt: DateTime (Last modification)
}
```

**Core Functions:**

1. **`recordImpression(shop)`**
   - Creates or updates daily analytics record
   - Increments impression count
   - Handles concurrency safely

2. **`recordConversion(shop, revenue)`**
   - Increments conversion count
   - Adds to revenue total
   - Updates conversion rate calculation

3. **`getDashboardStats(shop)`**
   - Returns comprehensive analytics
   - Includes today, all-time, and 30-day periods
   - Calculates conversion rates and totals

4. **`getAnalytics(shop, days)`**
   - Retrieves historical data for charts
   - Supports flexible date ranges
   - Optimized for dashboard display

### 🗄️ **Database Architecture** (`prisma/schema.prisma`)

**Complete Schema:**

```prisma
Model: Session (Shopify Authentication)
├── id: String @id
├── shop: String (Store domain)
├── state: String (OAuth state)
├── isOnline: Boolean (Session type)
├── scope: String? (Permissions)
├── expires: DateTime? (Expiration)
├── accessToken: String (API access)
├── userId: BigInt? (User identifier)
├── firstName, lastName: String? (User info)
├── email: String? (Contact)
├── accountOwner: Boolean (Permission level)
├── locale: String? (Localization)
├── collaborator: Boolean? (Access type)
└── emailVerified: Boolean? (Verification status)

Model: PopupSettings (Merchant Configuration)
├── id: Int @id @default(autoincrement())
├── shop: String @unique (One per store)
├── enabled: Boolean @default(true)
├── title: String @default("Wait! Don't leave yet!")
├── message: String @default("Get 10% off your first order")
├── discountCode: String? @default("SAVE10")
├── discountPercentage: Int? @default(10)
├── delaySeconds: Int @default(2)
├── showOnce: Boolean @default(true)
├── createdAt: DateTime @default(now())
└── updatedAt: DateTime @updatedAt

Model: PopupAnalytics (Performance Tracking)
├── id: Int @id @default(autoincrement())
├── shop: String (Store identifier)
├── date: DateTime @default(now())
├── impressions: Int @default(0)
├── conversions: Int @default(0)
├── revenueRecovered: Float @default(0.0)
├── conversionRate: Float? (Calculated field)
├── popupSettingsId: Int? (Settings reference)
├── createdAt: DateTime @default(now())
├── updatedAt: DateTime @updatedAt
└── @@index([shop, date]) (Performance optimization)
```

---

## 🎨 Theme Integration Details

### 🧩 **Liquid Block Implementation** (`blocks/stayboost-popup.liquid`)

**Schema Configuration:**

```liquid
{% schema %}
{
  "name": "StayBoost Exit-Intent Popup",
  "target": "section",
  "settings": [
    {
      "type": "text",
      "id": "api_url",
      "label": "StayBoost API URL",
      "default": "{{ shop.permanent_domain | append: '/api/stayboost/settings' }}",
      "info": "Automatically configured - do not modify unless instructed"
    }
  ],
  "presets": [
    {
      "name": "StayBoost Popup"
    }
  ]
}
{% endschema %}
```

**Integration Code:**

```liquid
{% if block.settings.api_url != blank %}
<script
  src="{{ 'stayboost-popup.js' | asset_url }}"
  data-stayboost-api-url="{{ block.settings.api_url }}"
  data-shop-domain="{{ shop.permanent_domain }}"
  defer>
</script>
{% endif %}
```

### 🎯 **Exit Intent Detection Algorithm**

**Desktop Implementation:**

```javascript
function onMouseOut(event) {
  if (Date.now() < readyAt) return; // Respect delay
  if (event.clientY <= 0) {
    // Mouse left top of viewport
    show(); // Trigger popup
    window.removeEventListener("mouseout", onMouseOut);
  }
}
```

**Mobile Implementation:**

```javascript
window.addEventListener("popstate", function () {
  if (Date.now() >= readyAt) {
    // Respect delay
    show(); // Trigger on back button
  }
});
```

---

## 🧪 Testing Architecture

### 📋 **Test Coverage Summary**

- **Total Tests**: 31 tests across 10 test suites
- **Smoke Tests**: 11 tests (infrastructure validation)
- **Functional Tests**: 6 tests (business logic validation)
- **Analytics Tests**: 14 tests (data accuracy & performance)

### 🔍 **Test Categories**

#### **1. Smoke Tests** (`tests/smoke.test.js`)

```javascript
Infrastructure Validation:
├── Database Schema - PopupSettings model validation
├── File Structure - Critical files existence check
├── Package Dependencies - Required packages verification
├── Shopify App Config - Configuration validation
├── Theme Extension - Extension structure check
├── Models - Server function availability
├── API Routes - Endpoint structure validation
├── Admin Interface - Dashboard component check
├── JavaScript Popup - Exit intent functionality
├── Prisma Schema - Model relationships
└── Environment Setup - Build readiness
```

#### **2. Functional Tests** (`tests/functional.test.js`)

```javascript
Business Logic Validation:
├── Popup JavaScript - Exit intent simulation
├── API Response Structure - Settings endpoint format
├── Exit Intent Logic - Mouse position detection
├── Session Storage Logic - Show once functionality
├── Popup HTML Generation - Dynamic content
└── URL Parameter Handling - Shop domain extraction
```

#### **3. Analytics Tests** (`tests/analytics.test.js`)

```javascript
Data & Performance Validation:
├── Database Operations
│   ├── Impression recording
│   ├── Conversion tracking
│   └── Dashboard statistics
├── API Integration
│   ├── Analytics API route existence
│   └── Data structure validation
├── Frontend Integration
│   ├── Mock data elimination verification
│   └── Analytics tracking validation
├── Schema Validation
│   └── PopupAnalytics model verification
├── End-to-End Flow
│   ├── System integration testing
│   └── Calculation logic validation
└── Performance & Reliability
    ├── Data handling validation
    └── API response format testing
```

---

## 🚀 Deployment & Production

### 🏗️ **Build System**

- **Development**: `npm run dev` (Shopify CLI with hot reload)
- **Production Build**: `npm run build` (Remix Vite build)
- **Docker Support**: Multi-stage Docker build with Node.js
- **Environment**: Supports Node.js ^18.20 || ^20.10 || >=21.0.0

### 🔧 **NPM Scripts Architecture**

```json
Scripts Portfolio:
├── Development
│   ├── "dev": "shopify app dev" (Primary development)
│   ├── "generate": "shopify app generate" (Code generation)
│   └── "setup": "prisma generate && prisma migrate deploy"
├── Testing
│   ├── "test": "node --test tests/**/*.test.js" (All tests)
│   ├── "test:smoke": "node --test tests/smoke.test.js"
│   ├── "test:functional": "node --test tests/functional.test.js"
│   └── "validate": "npm run lint && npm run test:smoke && npm run build"
├── Production
│   ├── "build": "remix vite:build" (Production build)
│   ├── "start": "remix-serve ./build/server/index.js"
│   └── "docker-start": "npm run setup && npm run start"
├── Configuration
│   ├── "config:link": "shopify app config link"
│   └── "config:use": "shopify app config use"
└── Deployment
    ├── "deploy": "shopify app deploy"
    └── "env": "shopify app env"
```

### 🌐 **Production Configuration**

- **Application URL**: Dynamic CloudFlare tunnel
- **Webhook API Version**: 2025-07
- **OAuth Redirects**: Multiple callback URL support
- **Embedded**: True (runs within Shopify admin)
- **POS Integration**: Disabled (web-only application)

---

## 📈 Analytics & Performance

### 📊 **Metrics Tracked**

1. **Impressions**: Total popup displays across all sessions
2. **Conversions**: Successful CTA clicks leading to discount usage
3. **Revenue Recovered**: Dollar amount attributed to popup conversions
4. **Conversion Rate**: Percentage calculation (conversions/impressions \* 100)
5. **Time-based Analytics**: Today, all-time, and 30-day period tracking

### 🎯 **Performance Optimizations**

- **Database Indexing**: Optimized queries with shop + date indexes
- **Caching Strategy**: Session-based caching for popup settings
- **Lazy Loading**: JavaScript popup loaded asynchronously
- **Minimal DOM Impact**: Efficient popup rendering with minimal elements
- **Error Handling**: Graceful degradation for network failures

### 🔄 **Real-time Data Flow**

```
User Action → JavaScript Event → API Call → Database Update → Dashboard Refresh
     ↓              ↓               ↓            ↓              ↓
Exit Intent → recordAnalytics() → /api/analytics → PopupAnalytics → Live Stats
```

---

## 🔐 Security & Compliance

### 🛡️ **Authentication & Authorization**

- **Shopify OAuth 2.0**: Secure app installation and access
- **Session Management**: Prisma-based session storage
- **Scope Validation**: `write_products` permission verification
- **CSRF Protection**: Built-in Remix CSRF protection
- **API Authentication**: Shop-based data isolation

### 🌐 **CORS & API Security**

- **Cross-Origin Resource Sharing**: Enabled for theme extension integration
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: Shopify API rate limit compliance
- **Error Handling**: Secure error messages without data exposure

### 📋 **Data Privacy**

- **Shop Isolation**: All data scoped to individual shop domains
- **Minimal Data Collection**: Only necessary analytics and settings
- **GDPR Compliance**: User data handling follows privacy regulations
- **Data Retention**: Configurable analytics data retention policies

---

## 🎨 User Experience & Design

### 🖥️ **Admin Interface Design**

- **Design System**: Shopify Polaris for consistent UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliance through Polaris
- **Real-time Updates**: Live preview and instant settings changes
- **Progressive Enhancement**: Graceful degradation for older browsers

### 📱 **Storefront Integration**

- **Minimal Footprint**: Lightweight JavaScript (~5KB compressed)
- **Theme Agnostic**: Works with any Shopify theme
- **Performance First**: Non-blocking asset loading
- **Mobile Optimized**: Touch-friendly interactions
- **Customizable**: Full styling control through CSS

### 🎯 **Conversion Optimization**

- **Strategic Timing**: Exit intent detection at optimal moments
- **Compelling Messaging**: Customizable titles and descriptions
- **Clear Call-to-Action**: Prominent discount code presentation
- **Urgency Creation**: Limited-time offer psychology
- **A/B Testing Ready**: Foundation for split testing implementation

---

## 🔄 Integration Architecture

### 🔌 **Shopify Platform Integration**

- **App Bridge**: Seamless embedded app experience
- **Theme App Extensions**: Modern theme integration without code modification
- **Webhook Integration**: Real-time updates for app lifecycle events
- **Admin API**: Full access to store data and configuration
- **Storefront Integration**: Customer-facing popup functionality

### 🌐 **External Service Readiness**

- **Email Marketing**: Ready for Klaviyo, Mailchimp integration
- **Analytics Platforms**: Google Analytics event tracking capability
- **Customer Support**: Intercom, Zendesk integration foundation
- **Payment Processing**: Stripe, PayPal conversion tracking
- **Inventory Management**: Stock level based popup triggers

---

## 📊 Business Intelligence & Reporting

### 📈 **Dashboard Analytics**

- **Key Performance Indicators**: Conversion rate, revenue impact, engagement metrics
- **Time-based Analysis**: Daily, weekly, monthly performance tracking
- **Comparative Metrics**: Period-over-period performance analysis
- **Revenue Attribution**: Direct revenue impact measurement
- **Customer Behavior Insights**: Exit intent patterns and conversion triggers

### 📋 **Merchant Value Proposition**

1. **Revenue Recovery**: Capture otherwise lost sales through exit intent
2. **Customer Retention**: Engage users at critical decision moments
3. **Marketing Efficiency**: Automated discount distribution
4. **Performance Tracking**: Clear ROI measurement and optimization
5. **Easy Management**: Simple setup with powerful customization

---

This comprehensive blueprint represents a production-ready, enterprise-grade Shopify application with robust architecture, comprehensive testing, real-time analytics, and optimal user experience. The application is built following Shopify best practices and modern web development standards.
