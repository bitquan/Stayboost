# Technical Architecture Documentation

## 🏗 System Architecture Overview

StayBoost is built on a modern, scalable architecture using Remix as the full-stack framework with Shopify integration. The system is designed for high performance, reliability, and maintainability.

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        StayBoost Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Admin)     │  Backend Services     │  External APIs   │
│                       │                       │                  │
│  ┌─────────────────┐  │  ┌─────────────────┐  │  ┌─────────────┐ │
│  │   React Admin   │  │  │  Remix Server   │  │  │  Shopify    │ │
│  │   Interface     │◄─┼─►│     Runtime     │◄─┼─►│    API      │ │
│  │   (Polaris UI)  │  │  │                 │  │  │             │ │
│  └─────────────────┘  │  └─────────────────┘  │  └─────────────┘ │
│                       │                       │                  │
│  ┌─────────────────┐  │  ┌─────────────────┐  │  ┌─────────────┐ │
│  │ Storefront JS   │  │  │  Database       │  │  │ Third-party │ │
│  │ Popup Client    │◄─┼─►│  (Prisma ORM)   │◄─┼─►│ Services    │ │
│  │                 │  │  │                 │  │  │             │ │
│  └─────────────────┘  │  └─────────────────┘  │  └─────────────┘ │
│                       │                       │                  │
│                       │  ┌─────────────────┐  │  ┌─────────────┐ │
│                       │  │  Redis Cache    │  │  │  Analytics  │ │
│                       │  │  Rate Limiting  │◄─┼─►│  Platforms  │ │
│                       │  │                 │  │  │             │ │
│                       │  └─────────────────┘  │  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Technology Stack

### Core Framework
- **Remix 2.16.1**: Full-stack React framework with SSR
- **Vite 6.3.5**: Modern build tool and development server
- **React 18.2.0**: UI library with concurrent features
- **TypeScript**: Type-safe development (optional)

### Backend Services
- **Node.js 18+**: Server runtime environment
- **Prisma ORM**: Database operations and migrations
- **PostgreSQL**: Production database
- **SQLite**: Development database
- **Redis**: Caching and rate limiting

### Frontend Technologies
- **Shopify Polaris 12.0.0**: Admin UI component library
- **Shopify App Bridge**: Native Shopify integration
- **CSS3**: Responsive styling
- **Vanilla JavaScript**: Storefront popup implementation

### Development Tools
- **ESLint**: Code linting and standards
- **Prettier**: Code formatting
- **Vite**: Development server and building
- **Shopify CLI**: App development and deployment

## 🏛 Application Architecture

### 1. Remix Application Structure

```
app/
├── routes/              # Route handlers and UI
│   ├── app._index.jsx   # Main dashboard
│   ├── app.*.jsx        # Feature-specific pages
│   └── api.*.jsx        # API endpoints
├── utils/               # Business logic utilities
│   ├── *.server.js      # Server-side utilities
│   └── shared/          # Shared utilities
├── models/              # Data access layer
├── components/          # Reusable React components
└── styles/              # CSS and styling
```

### 2. Server-Side Architecture

```
Remix Server
├── Route Handlers       # Request/response handling
├── Loaders             # Data fetching
├── Actions             # Form submissions and mutations
├── Middleware          # Authentication, rate limiting
└── Error Boundaries    # Error handling
```

### 3. Database Architecture

```sql
-- Core Tables
Sessions (Shopify app sessions)
├── id (primary key)
├── shop (shop domain)
├── state (session state)
├── isOnline (session type)
├── scope (permissions)
├── expires (expiration)
├── accessToken (OAuth token)
└── userId (user identifier)

PopupSettings (popup configuration)
├── id (primary key)
├── shop (shop domain, unique)
├── enabled (boolean)
├── title (string)
├── message (string)
├── discountCode (string)
├── discountPercentage (integer)
├── delaySeconds (integer)
├── showOnce (boolean)
├── template (string)
├── targeting (JSON)
├── styling (JSON)
├── createdAt (timestamp)
└── updatedAt (timestamp)

-- Extended Tables (for advanced features)
ABTests, Analytics, Segments, Integrations, etc.
```

## 🔄 Data Flow Architecture

### 1. Admin Interface Flow

```
User Action → React Component → Remix Action → 
Business Logic → Database → Response → UI Update
```

Example:
```javascript
// 1. User clicks save button
<Button onClick={handleSave}>Save Settings</Button>

// 2. Form submission triggers Remix action
export async function action({ request }) {
  const formData = await request.formData();
  
  // 3. Business logic processes data
  const settings = await savePopupSettings(
    formData.get('shop'),
    formData.get('settings')
  );
  
  // 4. Database operation via Prisma
  const result = await prisma.popupSettings.upsert({
    where: { shop },
    update: settings,
    create: { shop, ...settings }
  });
  
  // 5. Response sent back to client
  return json({ success: true, settings: result });
}
```

### 2. Storefront Integration Flow

```
Page Load → Theme Extension → API Request → 
Settings Retrieval → Popup Rendering → User Interaction
```

Example:
```javascript
// 1. Theme extension loads
document.addEventListener('DOMContentLoaded', async () => {
  
  // 2. Fetch popup settings
  const response = await fetch(
    `/api/stayboost/settings?shop=${shop}`
  );
  const settings = await response.json();
  
  // 3. Initialize popup with settings
  if (settings.enabled) {
    initializePopup(settings);
  }
});
```

## 🔐 Security Architecture

### 1. Authentication & Authorization

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shopify       │    │   StayBoost     │    │   Database      │
│   Admin         │    │   Server        │    │                 │
│                 │    │                 │    │                 │
│  OAuth Flow     │◄──►│  Session        │◄──►│  Session        │
│  Access Token   │    │  Management     │    │  Storage        │
│  Permissions    │    │  Validation     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Input Validation & Sanitization

```javascript
// Multi-layer validation
const validationPipeline = [
  schemaValidation,     // Zod/Joi schema validation
  businessValidation,   // Custom business rules
  sanitization,         // DOMPurify for XSS prevention
  persistence          // Database constraints
];
```

### 3. Rate Limiting Strategy

```javascript
// Redis-based rate limiting
const rateLimiter = {
  keyGenerator: (shop, endpoint) => `rate_limit:${shop}:${endpoint}`,
  limits: {
    api: { requests: 1000, window: 3600 },
    popup: { requests: 10000, window: 3600 }
  },
  strategy: 'sliding_window_counter'
};
```

## 📊 Performance Architecture

### 1. Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                           │
├─────────────────────────────────────────────────────────────┤
│  Browser Cache  │  CDN Cache    │  Redis Cache │  Database   │
│  (Static Assets)│  (Global)     │  (App Data)  │  (Source)   │
│                 │               │              │             │
│  ┌─────────────┐│ ┌───────────┐ │ ┌──────────┐ │ ┌─────────┐ │
│  │ CSS/JS      ││ │ Images    │ │ │ Settings │ │ │ Prisma  │ │
│  │ Components  ││ │ Assets    │ │ │ Analytics│ │ │ Query   │ │
│  │ (24h TTL)   ││ │ (7d TTL)  │ │ │ (1h TTL) │ │ │ Results │ │
│  └─────────────┘│ └───────────┘ │ └──────────┘ │ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Database Optimization

```sql
-- Optimized indexes for common queries
CREATE INDEX idx_popup_settings_shop ON PopupSettings(shop);
CREATE INDEX idx_analytics_shop_date ON Analytics(shop, date);
CREATE INDEX idx_ab_tests_shop_status ON ABTests(shop, status);

-- Connection pooling configuration
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=5000
DATABASE_POOL_IDLE=10000
```

### 3. Code Splitting & Lazy Loading

```javascript
// Route-based code splitting
const Analytics = lazy(() => import('./routes/app.analytics'));
const ABTesting = lazy(() => import('./routes/app.ab-testing'));
const Templates = lazy(() => import('./routes/app.templates'));

// Component lazy loading
const ChartComponent = lazy(() => 
  import('./components/Chart').then(module => ({
    default: module.Chart
  }))
);
```

## 🔄 State Management

### 1. Server State (Remix)

```javascript
// Remix loader for server state
export async function loader({ request, params }) {
  const shop = getShopFromRequest(request);
  
  // Parallel data fetching
  const [settings, analytics, tests] = await Promise.all([
    getPopupSettings(shop),
    getAnalytics(shop, { period: '7d' }),
    getActiveABTests(shop)
  ]);
  
  return json({ settings, analytics, tests });
}
```

### 2. Client State (React)

```javascript
// Local state management with hooks
const usePopupSettings = (shop) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const updateSettings = useCallback(async (newSettings) => {
    setLoading(true);
    try {
      const response = await updatePopupSettings(shop, newSettings);
      setSettings(response.settings);
    } finally {
      setLoading(false);
    }
  }, [shop]);
  
  return { settings, loading, updateSettings };
};
```

## 🌐 API Architecture

### 1. RESTful Endpoint Design

```
GET    /api/stayboost/settings           # Get settings
POST   /api/stayboost/settings           # Update settings
GET    /api/stayboost/analytics          # Get analytics
POST   /api/stayboost/ab-tests           # Create A/B test
GET    /api/stayboost/ab-tests/:id       # Get test results
```

### 2. Response Standardization

```javascript
// Consistent API response format
const ApiResponse = {
  success: boolean,
  data?: any,
  error?: {
    code: string,
    message: string,
    details?: any
  },
  meta?: {
    timestamp: string,
    requestId: string,
    pagination?: PaginationMeta
  }
};
```

### 3. Error Handling Strategy

```javascript
// Centralized error handling
export class ApiError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Error boundary for API routes
export function handleApiError(error, request) {
  if (error instanceof ApiError) {
    return json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: error.statusCode });
  }
  
  // Log unexpected errors
  console.error('Unexpected API error:', error);
  
  return json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }, { status: 500 });
}
```

## 🔧 Development Architecture

### 1. Environment Configuration

```javascript
// Environment-specific configuration
const config = {
  development: {
    database: 'sqlite:./dev.db',
    redis: 'redis://localhost:6379',
    logLevel: 'debug',
    hotReload: true
  },
  staging: {
    database: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL,
    logLevel: 'info',
    monitoring: true
  },
  production: {
    database: process.env.DATABASE_URL,
    redis: process.env.REDIS_URL,
    logLevel: 'warn',
    monitoring: true,
    security: 'strict'
  }
};
```

### 2. Build Pipeline

```yaml
# Build process
1. Type Checking (TypeScript)
2. Linting (ESLint)
3. Testing (Node.js Test Runner)
4. Building (Vite)
5. Asset Optimization
6. Bundle Analysis
7. Deployment Package
```

### 3. Monitoring & Observability

```javascript
// Application monitoring
const monitoring = {
  performance: {
    metrics: ['response_time', 'throughput', 'error_rate'],
    alerts: ['p95_response_time > 500ms', 'error_rate > 1%']
  },
  logging: {
    levels: ['error', 'warn', 'info', 'debug'],
    structured: true,
    correlation: 'request_id'
  },
  tracing: {
    enabled: true,
    sampleRate: 0.1,
    endpoints: 'all'
  }
};
```

## 🚀 Deployment Architecture

### 1. Container Strategy

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stayboost-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stayboost
  template:
    metadata:
      labels:
        app: stayboost
    spec:
      containers:
      - name: app
        image: stayboost:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 3. CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy StayBoost
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/stayboost-app
```

## 📈 Scalability Considerations

### 1. Horizontal Scaling

- **Stateless Application**: No server-side sessions
- **Load Balancing**: Multiple app instances
- **Database Scaling**: Read replicas and connection pooling
- **Cache Scaling**: Redis cluster for high availability

### 2. Performance Optimization

- **Code Splitting**: Route and component-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Bundle Optimization**: Tree shaking and minification
- **Asset Optimization**: Image compression and CDN delivery

### 3. Resource Management

- **Memory Management**: Proper cleanup and garbage collection
- **CPU Optimization**: Efficient algorithms and async processing
- **Network Optimization**: Compression and connection reuse
- **Storage Optimization**: Database indexing and query optimization

---

**Architecture Version**: 1.0.0  
**Last Updated**: ${new Date().toISOString()}  
**Compatibility**: Remix 2.16.1, React 18.2.0, Node.js 18+  
**Status**: Production Ready
