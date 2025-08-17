# Troubleshooting Guide

## 🔧 Overview

This comprehensive troubleshooting guide covers common issues, error scenarios, and solutions for StayBoost. It includes diagnostic procedures, error codes, and step-by-step resolution guides.

## 🚨 Common Issues & Solutions

### 1. Application Startup Issues

#### Issue: Application won't start

**Symptoms**:
- Server fails to start
- Port already in use errors
- Database connection failures

**Diagnostic Steps**:
```bash
# Check if port is in use
lsof -i :3000

# Check environment variables
echo $DATABASE_URL
echo $SHOPIFY_API_KEY

# Check database connection
npx prisma db push

# Check logs
npm run dev 2>&1 | tee startup.log
```

**Solutions**:

1. **Port Conflict**:
```bash
# Kill process using port 3000
kill -9 $(lsof -t -i:3000)

# Or use different port
PORT=3001 npm run dev
```

2. **Missing Environment Variables**:
```bash
# Copy environment template
cp .env.example .env

# Update with your values
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
DATABASE_URL="file:./dev.db"
```

3. **Database Issues**:
```bash
# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push
```

### 2. Shopify Authentication Issues

#### Issue: OAuth authentication fails

**Symptoms**:
- "Invalid request" errors
- Redirect loop during authentication
- Access token validation failures

**Diagnostic Steps**:
```javascript
// Check OAuth parameters
console.log('OAuth params:', {
  clientId: process.env.SHOPIFY_API_KEY,
  redirectUri: process.env.SHOPIFY_APP_URL,
  scopes: process.env.SHOPIFY_SCOPES
});

// Validate shop domain
const shopDomain = request.query.shop;
if (!shopDomain.endsWith('.myshopify.com')) {
  throw new Error('Invalid shop domain');
}
```

**Solutions**:

1. **Invalid App URL**:
```bash
# Update app URL in .env
SHOPIFY_APP_URL=https://your-app.ngrok.io

# Update in Shopify Partner Dashboard
# App setup → App URL: https://your-app.ngrok.io
# Allowed redirection URLs: https://your-app.ngrok.io/auth/callback
```

2. **Scope Mismatch**:
```bash
# Update scopes in .env
SHOPIFY_SCOPES=read_products,write_orders,read_customers

# Force re-authentication
# Delete existing sessions and re-install app
```

3. **HTTPS Required**:
```bash
# Use ngrok for local development
ngrok http 3000

# Update SHOPIFY_APP_URL with ngrok URL
SHOPIFY_APP_URL=https://abc123.ngrok.io
```

### 3. Database Connection Issues

#### Issue: Database queries fail

**Symptoms**:
- Connection timeout errors
- "Database does not exist" errors
- Prisma client generation failures

**Diagnostic Steps**:
```bash
# Test database connection
npx prisma db pull

# Check database URL format
echo $DATABASE_URL

# Verify database exists
psql $DATABASE_URL -c "SELECT version();"
```

**Solutions**:

1. **PostgreSQL Connection**:
```bash
# Install PostgreSQL locally
brew install postgresql
brew services start postgresql

# Create database
createdb stayboost_dev

# Update DATABASE_URL
DATABASE_URL="postgresql://username:password@localhost:5432/stayboost_dev"
```

2. **SQLite Issues** (Development):
```bash
# Delete existing database
rm -f dev.db

# Run migrations
npx prisma migrate dev

# Generate client
npx prisma generate
```

3. **Production Database**:
```bash
# Check connection string format
DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"

# Test connection
pg_isready -d $DATABASE_URL
```

### 4. Popup Display Issues

#### Issue: Popup doesn't appear on storefront

**Symptoms**:
- No popup shows on exit intent
- JavaScript errors in browser console
- Popup settings not loading

**Diagnostic Steps**:
```javascript
// Check API endpoint
fetch('/api/stayboost/settings?shop=your-shop.myshopify.com')
  .then(r => r.json())
  .then(console.log);

// Check popup script loading
console.log('Popup script loaded:', window.StayBoostPopup);

// Check settings
console.log('Popup settings:', popupSettings);
```

**Solutions**:

1. **Theme Integration**:
```liquid
<!-- Add to theme.liquid before </body> -->
{% if shop.permanent_domain == 'your-shop.myshopify.com' %}
  <script src="{{ 'stayboost-popup.js' | asset_url }}" defer></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      if (window.StayBoostPopup) {
        window.StayBoostPopup.init({
          shop: '{{ shop.permanent_domain }}',
          apiUrl: 'https://your-app.com/api/stayboost/settings'
        });
      }
    });
  </script>
{% endif %}
```

2. **CORS Issues**:
```javascript
// Update API route headers
export async function loader({ request }) {
  const response = json(data);
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}
```

3. **JavaScript Errors**:
```javascript
// Add error handling to popup script
try {
  // Popup initialization code
  initializePopup(settings);
} catch (error) {
  console.error('StayBoost popup error:', error);
  
  // Send error to monitoring
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/errors', JSON.stringify({
      error: error.message,
      stack: error.stack,
      url: window.location.href
    }));
  }
}
```

### 5. Performance Issues

#### Issue: Slow application response

**Symptoms**:
- High response times (>500ms)
- Database query timeouts
- Memory usage warnings

**Diagnostic Steps**:
```bash
# Check memory usage
node --inspect app.js
# Open chrome://inspect in browser

# Monitor database queries
npx prisma studio

# Check CPU usage
top -p $(pgrep node)

# Analyze bundle size
npm run build -- --analyze
```

**Solutions**:

1. **Database Optimization**:
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_popup_settings_shop ON PopupSettings(shop);
CREATE INDEX CONCURRENTLY idx_analytics_shop_date ON Analytics(shop, date DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM PopupSettings WHERE shop = 'example.myshopify.com';
```

2. **Memory Leaks**:
```javascript
// Add memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage:', usage);
    
    // Force garbage collection
    if (global.gc) global.gc();
  }
}, 60000);
```

3. **Bundle Size Reduction**:
```javascript
// Implement code splitting
const Analytics = lazy(() => import('./Analytics'));
const ABTesting = lazy(() => import('./ABTesting'));

// Tree shake unused dependencies
import { Card } from '@shopify/polaris'; // Instead of entire library
```

## 🔍 Error Codes & Messages

### API Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `INVALID_SHOP` | 400 | Shop domain is invalid | Verify shop domain format |
| `UNAUTHORIZED` | 401 | Authentication required | Check access token |
| `FORBIDDEN` | 403 | Insufficient permissions | Update app scopes |
| `NOT_FOUND` | 404 | Resource not found | Check resource ID |
| `VALIDATION_ERROR` | 422 | Request validation failed | Check request payload |
| `RATE_LIMITED` | 429 | Rate limit exceeded | Implement backoff strategy |
| `INTERNAL_ERROR` | 500 | Internal server error | Check server logs |

### Database Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `P2002` | Unique constraint violation | Check for duplicate entries |
| `P2025` | Record not found | Verify record exists |
| `P1001` | Can't reach database | Check connection string |
| `P1008` | Operations timed out | Optimize queries |
| `P2003` | Foreign key constraint failed | Check related records |

## 🔧 Diagnostic Tools

### 1. Health Check Endpoint

```javascript
// Access health check
curl http://localhost:3000/health

// Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

### 2. Debug Mode

```bash
# Enable debug logging
DEBUG=stayboost:* npm run dev

# Or set environment variable
NODE_ENV=development npm run dev
```

### 3. Performance Profiling

```javascript
// Add performance markers
performance.mark('popup-start');
// ... popup code ...
performance.mark('popup-end');
performance.measure('popup-render', 'popup-start', 'popup-end');

// Get measurements
const measures = performance.getEntriesByType('measure');
console.log('Performance:', measures);
```

## 🛠 Development Debugging

### 1. React Developer Tools

```bash
# Install React DevTools browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

### 2. Remix Developer Tools

```javascript
// Add to root.jsx for development
export default function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}
```

### 3. Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# View database in browser
# http://localhost:5555

# Generate ERD
npx prisma generate --generator erd
```

## 📊 Monitoring & Alerting

### 1. Error Tracking

```javascript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('React error:', error, errorInfo);
    
    // Send to error tracking service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Banner status="critical">
          Something went wrong. Please refresh the page.
        </Banner>
      );
    }

    return this.props.children;
  }
}
```

### 2. Performance Monitoring

```javascript
// Real User Monitoring (RUM)
function trackPerformance() {
  // Core Web Vitals
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'LCP') {
        console.log('LCP:', entry.value);
      }
      if (entry.name === 'FID') {
        console.log('FID:', entry.value);
      }
      if (entry.name === 'CLS') {
        console.log('CLS:', entry.value);
      }
    }
  }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
}
```

## 🚀 Deployment Troubleshooting

### 1. Build Issues

```bash
# Clean build
rm -rf build node_modules
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for ESLint errors
npm run lint
```

### 2. Production Deployment

```bash
# Check environment variables
env | grep -E "(DATABASE_URL|SHOPIFY_|REDIS_URL)"

# Test production build locally
NODE_ENV=production npm start

# Check Docker build
docker build -t stayboost .
docker run -p 3000:3000 stayboost
```

### 3. Database Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Reset if needed (development only)
npx prisma migrate reset
```

## 📞 Getting Help

### 1. Log Collection

```bash
# Collect application logs
npm run dev 2>&1 | tee app.log

# Collect system logs (Linux)
journalctl -u stayboost -f

# Collect Docker logs
docker logs stayboost-container
```

### 2. System Information

```bash
# System info script
cat << EOF > system-info.sh
#!/bin/bash
echo "=== System Information ==="
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "OS: $(uname -a)"
echo "Memory: $(free -h)"
echo "Disk: $(df -h)"
echo "=== Environment Variables ==="
env | grep -E "(NODE_|DATABASE_|SHOPIFY_)" | sed 's/=.*/=***/'
echo "=== Package Versions ==="
npm list --depth=0
EOF
chmod +x system-info.sh
./system-info.sh
```

### 3. Support Checklist

Before contacting support, ensure you have:

- [ ] Error messages and stack traces
- [ ] System information (Node.js, OS versions)
- [ ] Environment configuration (sanitized)
- [ ] Steps to reproduce the issue
- [ ] Expected vs actual behavior
- [ ] Application logs
- [ ] Network/browser console errors (if frontend issue)

### 4. Community Resources

- **Documentation**: Check the comprehensive docs folder
- **GitHub Issues**: Search existing issues for solutions
- **Stack Overflow**: Tag questions with `stayboost` and `remix`
- **Discord/Slack**: Join the community channels

## 🔄 Recovery Procedures

### 1. Database Recovery

```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101_120000.sql

# Migrate to latest schema
npx prisma migrate deploy
```

### 2. Application Recovery

```bash
# Rollback to previous version
kubectl rollout undo deployment/stayboost

# Scale down and up
kubectl scale deployment stayboost --replicas=0
kubectl scale deployment stayboost --replicas=3

# Check pod status
kubectl get pods -l app=stayboost
```

### 3. Data Recovery

```javascript
// Recover corrupted settings
async function recoverPopupSettings(shop) {
  try {
    // Try to get settings
    let settings = await prisma.popupSettings.findUnique({
      where: { shop }
    });
    
    if (!settings || !settings.title) {
      // Restore default settings
      settings = await prisma.popupSettings.upsert({
        where: { shop },
        create: {
          shop,
          enabled: true,
          title: "Wait! Don't leave yet!",
          message: "Get 10% off your first order",
          discountCode: "SAVE10",
          discountPercentage: 10,
          delaySeconds: 2,
          showOnce: true
        },
        update: {
          title: "Wait! Don't leave yet!",
          message: "Get 10% off your first order"
        }
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Settings recovery failed:', error);
    throw error;
  }
}
```

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: ${new Date().toISOString()}  
**Coverage**: All major components and common issues  
**Status**: ✅ Comprehensive Troubleshooting Documentation
