# StayBoost - Shopify Exit-Intent Popup App

This is a Shopify app called StayBoost that captures abandoning customers with exit-intent popups and discount offers.

## Project Setup Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Shopify app for exit-intent popups
- [x] Scaffold the Project - Shopify app generated with Remix template
- [x] Customize the Project - StayBoost dashboard interface created
- [x] Install Required Extensions - No additional extensions needed
- [x] Compile the Project - Build successful with StayBoost interface
- [x] Create and Run Task - Development server task created and started
- [x] Launch the Project - Development server running on tinyplugs.myshopify.com
- [x] Ensure Documentation is Complete - README, LAUNCH_SUMMARY, and comprehensive tests
- [x] Database Schema - PopupSettings + PopupTemplate models implemented with Prisma
- [x] Frontend Interface - Complete admin dashboard with preview and template library
- [x] Theme Extension - JavaScript popup and Liquid block for storefront
- [x] API Endpoints - Settings API for frontend-backend communication
- [x] Template System - 22 professional templates across 4 categories implemented
- [x] Template Database - Seeded with default templates and usage statistics
- [x] Template Authentication - Fixed server-side loading and Shopify admin authentication
- [x] Template JSON Parsing - Added proper config field parsing for database templates
- [x] Comprehensive Testing - 19/19 tests passing (smoke + functional + integration)
- [x] Production Build - Successful build with optimized assets
- [x] Demo Scripts - Complete validation and demo scripts created

## New Tasks for Copilot

### High Priority (Next Sprint)
- [x] **Apply Template Functionality** - Implement template application to popup settings
  - ✅ Created `/api/apply-template` endpoint with authentication
  - ✅ Template config parsing and popup settings integration
  - ✅ Usage statistics tracking and template usage count updates
  - ✅ Loading states and error handling in UI
  - ✅ One-click template application working end-to-end
- [x] **Template Performance Tracking** - Add conversion rate tracking per template
  - ✅ Created `/api/track-performance` endpoint for impression/conversion/dismiss tracking
  - ✅ Enhanced database schema with dismissals field in TemplateUsageStats
  - ✅ Theme extension JavaScript updated with comprehensive tracking functions
  - ✅ Created `/api/template-analytics` endpoint for performance data retrieval
  - ✅ Built complete analytics dashboard at `/app/analytics` with performance metrics
  - ✅ Added navigation integration and comprehensive test coverage (16/16 tests passing)
  - ✅ Session-based tracking with automatic conversion rate calculations
- [x] **Custom Template Creation** - Allow merchants to create custom templates
  - ✅ Created `/api/custom-templates` endpoint with full CRUD operations (POST, PUT, DELETE)
  - ✅ Built `CustomTemplateModal.jsx` component with comprehensive form controls and styling options
  - ✅ Created `TemplatePreview.jsx` component for live preview functionality
  - ✅ Integrated custom template management into templates page with edit/delete capabilities
  - ✅ Template validation, authentication, and error handling implemented
  - ✅ One-click custom template creation and application working end-to-end
- [x] **Template Import/Export** - Enable template sharing between stores
  - ✅ Created `/api/template-import-export` endpoint with import/export functionality
  - ✅ Built `TemplateImportExportModal.jsx` component with file upload and template selection
  - ✅ JSON-based export format with version control and metadata
  - ✅ Bulk template import with overwrite protection and error handling
  - ✅ Exportable template filtering (custom + built-in templates)
  - ✅ Import validation with detailed success/error reporting
- [x] **Advanced Template Preview** - Real-time preview with merchant's branding
  - ✅ Created `AdvancedTemplatePreview.jsx` component with device-responsive previews
  - ✅ Built `merchantBranding.server.js` service with Shopify API integration and caching
  - ✅ Created `/api/merchant-branding` endpoint for branding data with theme support
  - ✅ Integrated advanced preview into templates page with "Advanced Preview" buttons
  - ✅ Device-responsive previews (Desktop 1200px, Tablet 768px, Mobile 375px)
  - ✅ Real-time merchant branding application (colors, fonts, shop name)
  - ✅ Full-screen modal with apply functionality and smooth animations
  - ✅ Cached performance with 5-minute merchant data expiration

### Medium Priority
- [x] **Template Categories Enhancement** - Add seasonal/event-based categories
  - ✅ Enhanced TEMPLATE_CATEGORIES from 5 to 16 comprehensive categories
  - ✅ Added seasonal categories: spring, summer, fall, winter with themed templates
  - ✅ Added event categories: Black Friday, Cyber Monday, Valentine's, Mother's/Father's Day, Back to School, New Year
  - ✅ Added special categories: birthday, flash sale, clearance with targeted templates
  - ✅ Created comprehensive template seeder with 18 new seasonal/event templates
  - ✅ Seeded 40 total templates across 18 categories in database
  - ✅ Enhanced template filtering and organization system
  - ✅ Comprehensive test coverage with 12/12 tests passing
- [x] **Template Favorites** - Allow merchants to favorite templates
  - ✅ Created TemplateFavorites database model with unique shop/template constraints
  - ✅ Built comprehensive favorites API with CRUD operations (POST/DELETE/GET)
  - ✅ Developed TemplateFavoriteButton component with star icons and loading states
  - ✅ Added favorites category filter to templates interface (⭐ My Favorites)
  - ✅ Integrated favorite buttons into template cards with real-time state management
  - ✅ Comprehensive test coverage with 12/12 tests passing for all CRUD operations
  - ✅ Successful production build and HMR integration
- [x] **Template Search** - Add search functionality across templates
  - ✅ Created `/api/template-search` endpoint with comprehensive search capabilities
  - ✅ Built `TemplateSearchFilters.jsx` component with real-time search and advanced filtering
  - ✅ Implemented fuzzy search across template names, descriptions, categories, and tags
  - ✅ Added advanced filtering by category, template type (built-in vs custom), and sorting options
  - ✅ Search suggestions generation for improved user experience when no results found
  - ✅ Debounced search queries (300ms) for performance optimization
  - ✅ Integration with favorites system and existing template infrastructure
  - ✅ Fixed Polaris import issues and completed frontend integration
  - ✅ Comprehensive test coverage with 14/14 tests passing for all search scenarios
  - ✅ Performance optimized for large template libraries (sub-100ms response times)
- [x] **Template Analytics Dashboard** - Show template performance metrics
  - ✅ Created complete analytics dashboard at `/app/analytics` with performance metrics
  - ✅ Built comprehensive analytics API with template performance tracking
  - ✅ Performance breakdown by template with impressions, conversions, dismissals
  - ✅ Summary statistics with total impressions, conversions, and average conversion rates
  - ✅ Color-coded performance badges and actionable insights for merchants
  - ✅ Integration with existing TemplateUsageStats database model
  - ✅ Navigation integration and responsive design with Polaris components
  - ✅ Comprehensive test coverage with 12/12 analytics tests passing
- [x] **A/B Testing for Templates** - Compare template performance
  - ✅ Created comprehensive A/B testing system with `/app/ab-testing` interface
  - ✅ Built `/api/ab-testing` endpoint with full CRUD operations for test management
  - ✅ Advanced test creation with multiple test types (title, message, discount, design, timing)
  - ✅ Real-time test monitoring with traffic allocation and statistical significance
  - ✅ Variant comparison with detailed performance metrics and winner determination
  - ✅ Integration with existing ABTest database models and analytics infrastructure
  - ✅ Statistical significance calculations and confidence intervals
  - ✅ Test lifecycle management (draft, running, paused, completed states)

### Low Priority (Future Enhancements)
- [x] **Template Localization** - Multi-language template support
  - ✅ Created comprehensive localization system with 20+ language support including RTL languages
  - ✅ Built `TemplateTranslation` database model with unique constraints for templateId, language, and key
  - ✅ Created `/api/template-localization` endpoint with full CRUD operations and auto-translation capabilities
  - ✅ Built `app.localization.jsx` interface with translation management, bulk editing, and auto-translate modals
  - ✅ Support for major world languages (English, Spanish, French, German, Japanese, Chinese, Arabic, Hebrew, etc.)
  - ✅ Auto-translation system with e-commerce-optimized translations for common popup elements
  - ✅ RTL language support for Arabic and Hebrew with proper text direction handling
  - ✅ Translation completion tracking and missing key identification for quality assurance
  - ✅ Bulk translation operations and language-specific filtering capabilities
  - ✅ Integration with existing template system and cascade deletion support
  - ✅ Comprehensive test coverage with 16/16 localization tests passing
  - ✅ Production build successful (app.localization-Bczm_XI_.js 13.18 kB gzipped)
- [x] **Template Marketplace** - Community template sharing
  - ✅ Created `/api/template-marketplace` endpoint with comprehensive marketplace functionality
  - ✅ Built `app.marketplace.jsx` interface with template browsing, search, and installation
  - ✅ Template publishing workflow allowing merchants to share templates publicly
  - ✅ Community rating and review system with average rating calculations
  - ✅ Template installation system creating private copies for installing shops
  - ✅ Featured templates showcase and marketplace statistics dashboard
  - ✅ Template discovery with category filtering and search functionality
  - ✅ Privacy protection with masked shop domains for template authors
  - ✅ Comprehensive test coverage with 12/12 marketplace tests passing
  - ✅ Navigation integration and production build compatibility
- [x] **AI Template Generation** - Generate templates based on merchant data
  - ✅ Created `/api/ai-templates` endpoint with intelligent template generation capabilities
  - ✅ Built `app.ai-templates.jsx` interface with AI generation wizard and suggestion system
  - ✅ Industry-specific template optimization (fashion, technology, food, etc.)
  - ✅ Goal-based template generation (conversion, email capture, retention, upsell)
  - ✅ Template analysis and optimization recommendations with scoring system
  - ✅ Performance-based suggestions using analytics data and industry best practices
  - ✅ Mobile-optimized template generation with responsive design elements
  - ✅ AI template evolution tracking with generation analytics and improvement metrics
  - ✅ Comprehensive test coverage with 13/13 AI generation tests passing
  - ✅ Navigation integration and production build compatibility
- [x] **Template Scheduling** - Schedule template changes for campaigns and events
  - ✅ Created TemplateSchedule and CampaignTemplate database models with comprehensive scheduling support
  - ✅ Built `/api/template-scheduling` endpoint with full CRUD operations and conflict resolution
  - ✅ Created `app.scheduling.jsx` interface with campaign management and scheduling workflow
  - ✅ Support for multiple campaign types (Black Friday, Christmas, Valentine's, flash sales, seasonal, etc.)
  - ✅ Advanced scheduling features including priority-based conflict resolution and timezone support
  - ✅ Schedule activation tracking with real-time status monitoring and performance analytics
  - ✅ Campaign template system with reusable templates and usage statistics
  - ✅ Auto-activation system with immediate and future scheduling capabilities
  - ✅ Comprehensive test coverage with 20/20 template scheduling tests passing
  - ✅ Production build successful (app.scheduling-U8gSZOkT.js 20.64 kB gzipped)
  - ✅ Navigation integration positioned between AI Templates and Localization
- [ ] **Template API v2** - Enhanced API with better performance

## Project Architecture & File Structure

### Core Application Files

- **`package.json`**: Main dependencies (Remix, Shopify Polaris, Prisma, Shopify App Remix)
- **`shopify.app.toml`**: App configuration (client_id: 8279a1a1278f468713b7aaf5fad1f7dc, name: StayBoost)
- **`app/shopify.server.js`**: Shopify app initialization with Prisma session storage
- **`app/db.server.js`**: Prisma client setup for database operations

### Frontend Interface

- **`app/routes/app._index.jsx`**: Main dashboard with settings form, preview, and analytics
  - Settings management (enable/disable, title, message, discount code, percentage, delay, show once)
  - Live preview of popup appearance
  - Mock analytics display (impressions, conversions, conversion rate)
  - Uses Shopify Polaris components for consistent UI

- **`app/routes/app.templates.jsx`**: Template library interface with 22 professional templates
  - Template browsing by category (Exit Intent, Sales, Holiday, Newsletter)
  - Live template preview with real-time styling
  - Server-side template loading via Remix loader (fixed authentication issues)
  - JSON config parsing for database templates with error handling
  - Fallback template system for reliable display
  - One-click template application to popup settings

- **`app/routes/app.jsx`**: App wrapper with Polaris styling and navigation

### Backend & Database

- **`prisma/schema.prisma`**: Database schema with extended models:
  - `Session`: Shopify app session management
  - `PopupSettings`: Stores popup configuration per shop (enabled, title, message, discountCode, discountPercentage, delaySeconds, showOnce)
  - `PopupTemplate`: Template library with config JSON field, usage statistics, and ratings (22 seeded templates)
  - `TemplateUsageStats`: Track template performance metrics
  - `TemplateRating`: User ratings for templates

- **`app/models/popupSettings.server.js`**: Data layer for popup settings
  - `getPopupSettings()`: Retrieves settings with defaults fallback
  - `savePopupSettings()`: Upserts settings to database
  - Default values: enabled=true, title="Wait! Don't leave yet!", message="Get 10% off your first order", discountCode="SAVE10", discountPercentage=10, delaySeconds=2, showOnce=true

- **`prisma/seed-templates.js`**: Template seeder with 22 professional templates
  - 5 Exit Intent templates (Classic, First-time visitor, Cart abandonment, Loyalty rewards, Referral bonus)
  - 7 Sales templates (Flash sale, Last chance, VIP access, Student discount, Weekend sale, Midnight sale, Free shipping)
  - 6 Holiday templates (Christmas, Birthday, Summer, Black Friday, Spring cleaning, Premium membership)
  - 4 Newsletter templates (Email capture, Back-in-stock, Review incentive, New arrivals)
  - Templates stored with config JSON field containing all popup styling and content
  - Successfully seeded and accessible via server-side loader

### API Layer

- **`app/routes/api.stayboost.settings.jsx`**: Public CORS-enabled endpoint
  - Returns popup settings for a given shop parameter
  - Used by theme extension to fetch configuration
  - Includes proper CORS headers for cross-origin requests

- **`app/routes/api.templates.jsx`**: Template management API endpoint
  - Server-side template CRUD operations with authentication
  - Supports both default and shop-specific templates
  - Enhanced query filtering with OR conditions for template access
  - Includes usage statistics and template performance tracking

### Theme Extension (Storefront Integration)

- **`extensions/stayboost-theme/`**: Theme app extension for Shopify stores
  - **`shopify.extension.toml`**: Extension configuration
  - **`blocks/stayboost-popup.liquid`**: Liquid block for theme integration
    - Loads JavaScript with API URL and shop domain
    - Configurable through theme editor
  - **`assets/stayboost-popup.js`**: Client-side popup implementation
    - Fetches settings from API endpoint
    - Exit-intent detection (mouse leaves viewport top)
    - Mobile support (back button detection)
    - Session storage for "show once" functionality
    - Responsive popup styling

## Data Flow & Integration

1. **Admin Configuration**: Merchant configures popup settings in `app._index.jsx`
2. **Database Storage**: Settings saved via `popupSettings.server.js` to Prisma database
3. **API Exposure**: Settings exposed through `api.stayboost.settings.jsx` endpoint
4. **Theme Integration**: Merchant adds Liquid block to theme, configures API URL
5. **Storefront Display**: JavaScript fetches settings and displays exit-intent popup

## Key Features Implementation

### Exit-Intent Detection

- Desktop: Mouse leaving viewport from top (`clientY <= 0`)
- Mobile: Browser back button via `popstate` event
- Configurable delay before popup can trigger

### Popup Behavior

- Show once per session (optional, using sessionStorage)
- Customizable content (title, message, discount code/percentage)
- Modal overlay with backdrop click to dismiss
- Two action buttons: claim offer and dismiss

### Settings Management

- Real-time preview in admin interface
- Form validation and state management
- Shopify Polaris components for consistent UX
- Automatic save functionality

## Development Guidelines

- Use Shopify CLI for app scaffolding and development (`npm run dev`)
- Follow Shopify app development best practices
- Remix framework for full-stack React application (NO Express.js)
- Prisma ORM for database operations (PostgreSQL production, SQLite development)
- Shopify Polaris for admin interface consistency
- CORS-enabled API for theme extension integration
- Focus on simple MVP first, then iterate with advanced features
- Ensure mobile responsiveness for popups
- **Technology Compatibility**: All enhancements must be Remix-compatible
- **No Express Dependencies**: Use Remix built-in server and custom middleware
- **Version Locking**: Maintain compatibility with React 18.2.0, Remix 2.16.1, Polaris 12.0.0
- **Security First**: Implement custom rate limiting, input sanitization, and error tracking
- **Performance Focus**: Use Node.js native APIs and Prisma optimizations

## Tech Stack

- **Framework**: Remix (React-based full-stack) - PRIMARY ARCHITECTURE
- **Backend**: Node.js with Shopify App APIs (NO Express.js)
- **Database**: Prisma ORM with PostgreSQL (production) / SQLite (development)
- **UI Library**: Shopify Polaris (version locked at 12.0.0)
- **Frontend**: React 18.2.0 with Shopify App Bridge
- **Theme Integration**: Liquid + Vanilla JavaScript
- **Testing**: Node.js Test Runner + Playwright
- **Security**: Custom rate limiting + DOMPurify + Sentry
- **Monitoring**: Winston logging + Sentry error tracking
- **Deployment**: Docker containerization
- **Build**: Vite (Remix compatible, NO Webpack)
