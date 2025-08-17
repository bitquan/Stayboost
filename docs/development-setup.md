# Development Setup Guide

## 🚀 Getting Started with StayBoost Development

This guide will help you set up a complete development environment for StayBoost, from initial setup to advanced development workflows.

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher  
- **Git**: Latest version
- **PostgreSQL**: 13.0 or higher (for production-like development)
- **Shopify CLI**: 3.45.0 or higher
- **ngrok**: For HTTPS tunneling (development)

### Recommended Tools

- **VS Code**: With Shopify extensions
- **Docker**: For containerized development
- **Postman**: For API testing
- **pgAdmin**: PostgreSQL administration

## 🛠 Environment Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/stayboost.git
cd stayboost

# Check out development branch
git checkout develop
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Shopify CLI globally
npm install -g @shopify/cli @shopify/theme
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=read_products,write_orders,read_customers,write_script_tags
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/stayboost_dev"

# Session Configuration
SESSION_SECRET=your_random_session_secret_here

# External Services
REDIS_URL="redis://localhost:6379"
SENTRY_DSN=your_sentry_dsn_here

# Development Settings
NODE_ENV=development
LOG_LEVEL=debug
```

### 4. Database Setup

#### Option A: PostgreSQL (Recommended)

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb stayboost_dev

# Set database URL
echo 'DATABASE_URL="postgresql://$(whoami)@localhost:5432/stayboost_dev"' >> .env
```

#### Option B: SQLite (Quick Setup)

```bash
# Use SQLite for quick development
echo 'DATABASE_URL="file:./dev.db"' >> .env
```

### 5. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 6. Shopify App Setup

```bash
# Login to Shopify CLI
shopify auth login

# Create new app (if not exists)
shopify app init stayboost

# Or use existing configuration
# The app should already be configured via shopify.app.toml
```

### 7. Start Development Server

```bash
# Start ngrok tunnel (in separate terminal)
ngrok http 3000

# Update SHOPIFY_APP_URL in .env with ngrok URL
# Example: SHOPIFY_APP_URL=https://abc123.ngrok.io

# Start development server
npm run dev

# Or use Shopify CLI
shopify app dev
```

## 🔧 Development Workflow

### Daily Development Process

1. **Pull Latest Changes**
```bash
git pull origin develop
npm install # In case of dependency updates
```

2. **Database Updates**
```bash
# Check for new migrations
npx prisma migrate status

# Apply if needed
npx prisma migrate dev
```

3. **Start Development Environment**
```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Start development server
npm run dev

# Terminal 3: Available for commands
```

### Code Style & Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code with Prettier
npm run format

# Type checking
npm run type-check
```

### Testing During Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- popup.test.js

# Run tests with coverage
npm run test:coverage
```

## 🏗 Project Structure Understanding

### Core Application Structure

```
app/
├── routes/                 # Remix routes
│   ├── app._index.jsx     # Main dashboard
│   ├── app.jsx           # App wrapper
│   └── api/              # API endpoints
├── models/               # Data models
├── utils/               # Utility functions
├── components/          # React components
└── styles/             # CSS/styling
```

### Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `app/routes/app._index.jsx` | Main dashboard UI | UI changes, form updates |
| `app/models/popupSettings.server.js` | Database operations | Data layer changes |
| `app/routes/api.stayboost.settings.jsx` | Settings API | API modifications |
| `extensions/stayboost-theme/` | Theme extension | Storefront integration |
| `prisma/schema.prisma` | Database schema | Database structure changes |

## 🧪 Testing Setup

### Unit Testing

```bash
# Install additional test dependencies (if needed)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run unit tests
npm run test:unit

# Generate coverage report
npm run test:coverage
```

### Integration Testing

```bash
# Start test database
createdb stayboost_test
DATABASE_URL="postgresql://$(whoami)@localhost:5432/stayboost_test" npx prisma migrate dev

# Run integration tests
npm run test:integration
```

### E2E Testing

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## 🐛 Debugging Setup

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug StayBoost",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@remix-run/serve/cli.js",
      "args": ["build"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Browser DevTools

1. **React DevTools**: Install browser extension
2. **Remix DevTools**: Available in development builds
3. **Shopify App Bridge DevTools**: For app bridge debugging

### Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# Access at http://localhost:5555

# Direct database access
psql $DATABASE_URL
```

## 🔍 Common Development Tasks

### Adding New Features

1. **Create Feature Branch**
```bash
git checkout -b feature/new-feature-name
```

2. **Database Changes**
```bash
# Edit prisma/schema.prisma
# Then create migration
npx prisma migrate dev --name add_new_feature
```

3. **Add Tests**
```bash
# Create test file
touch app/routes/__tests__/new-feature.test.jsx

# Write tests first (TDD approach)
npm test -- new-feature.test.jsx
```

4. **Implement Feature**
```bash
# Add component/route/model
# Run tests continuously
npm run test:watch
```

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm install package@latest

# Update all minor versions
npm update

# Major version updates (careful!)
npm install package@major.version
```

### Database Schema Changes

```bash
# Make changes to prisma/schema.prisma
# Create migration
npx prisma migrate dev --name descriptive_name

# Generate new client
npx prisma generate

# Update seed data if needed
npx prisma db seed
```

## 🚀 Building & Deployment

### Development Build

```bash
# Build for development
npm run build:dev

# Start built app
npm start
```

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
NODE_ENV=production npm start
```

### Docker Development

```bash
# Build development image
docker build -t stayboost:dev .

# Run with development database
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 📊 Performance Monitoring

### Development Performance

```bash
# Analyze bundle size
npm run build -- --analyze

# Profile app performance
NODE_ENV=development node --inspect app.js
# Open chrome://inspect
```

### Memory Profiling

```javascript
// Add to development code for memory monitoring
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB'
    });
  }, 30000);
}
```

## 🛡 Security in Development

### Environment Security

```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use different secrets for development
openssl rand -base64 32 # Generate random session secret
```

### HTTPS in Development

```bash
# Use ngrok for HTTPS
ngrok http 3000

# Or use mkcert for local HTTPS
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

## 📖 Learning Resources

### Remix Development

- [Remix Documentation](https://remix.run/docs)
- [Remix Tutorials](https://remix.run/tutorials)
- [Remix Examples](https://github.com/remix-run/examples)

### Shopify App Development

- [Shopify App Development](https://shopify.dev/apps)
- [Shopify CLI Documentation](https://shopify.dev/apps/tools/cli)
- [Shopify Polaris Components](https://polaris.shopify.com/)

### Testing Resources

- [Testing Library Docs](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

## 🎯 Next Steps

After completing this setup:

1. ✅ **Verify Installation**: Run `npm run dev` successfully
2. ✅ **Create Test Shop**: Install app in development store
3. ✅ **Run Tests**: Ensure all tests pass with `npm test`
4. ✅ **Make First Change**: Edit popup message and see it update
5. ✅ **Review Architecture**: Read through [Technical Architecture](./technical-architecture.md)
6. ✅ **Understand Features**: Browse [Feature Implementation](./feature-implementation.md)

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
lsof -i :3000
kill -9 PID
```

2. **Database Connection Failed**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql
brew services start postgresql
```

3. **Shopify Authentication Issues**
```bash
# Clear authentication
shopify auth logout
shopify auth login
```

4. **Node Version Issues**
```bash
# Use Node Version Manager
nvm install 18
nvm use 18
```

### Getting Help

- Check [Troubleshooting Guide](./troubleshooting-guide.md)
- Review error logs in terminal
- Check browser console for frontend issues
- Verify environment variables are correct

---

**Development Setup Guide Version**: 1.0.0  
**Last Updated**: ${new Date().toISOString()}  
**Target Audience**: Developers setting up StayBoost for the first time  
**Prerequisites Verified**: ✅ All system requirements documented
