# API Documentation

## 🌐 Overview

StayBoost provides a comprehensive REST API for managing popup settings, analytics, and integrations. This documentation covers all available endpoints, authentication, rate limiting, and usage examples.

## 🔐 Authentication

All API requests require authentication via Shopify's OAuth 2.0 flow or API keys for theme integration.

### Shopify OAuth 2.0 (Admin API)

```javascript
// Authentication header
headers: {
  'X-Shopify-Access-Token': 'your-access-token',
  'Content-Type': 'application/json'
}
```

### Public API (Theme Integration)

```javascript
// No authentication required for public endpoints
// Shop parameter identifies the store
fetch('/api/stayboost/settings?shop=example.myshopify.com')
```

## 📊 Rate Limiting

API endpoints are rate-limited to ensure fair usage and system stability.

### Rate Limits

| Endpoint Type | Requests | Window | Burst |
|---------------|----------|--------|-------|
| Admin API | 1,000 | 1 hour | 100 |
| Public API | 10,000 | 1 hour | 500 |
| Analytics API | 500 | 1 hour | 50 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 3600
```

## 🚀 Core API Endpoints

### Popup Settings

#### Get Popup Settings
```http
GET /api/stayboost/settings?shop={shop_domain}
```

**Parameters:**
- `shop` (required): Shop domain (e.g., example.myshopify.com)

**Response:**
```json
{
  "enabled": true,
  "title": "Don't leave yet!",
  "message": "Get 10% off your first order",
  "discountCode": "SAVE10",
  "discountPercentage": 10,
  "delaySeconds": 2,
  "showOnce": true,
  "template": "urgency",
  "targeting": {
    "countries": ["US", "CA"],
    "devices": ["desktop", "mobile"]
  },
  "styling": {
    "backgroundColor": "#ffffff",
    "textColor": "#333333",
    "buttonColor": "#007ace"
  }
}
```

#### Update Popup Settings
```http
POST /api/stayboost/settings
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "settings": {
    "enabled": true,
    "title": "Limited Time Offer!",
    "message": "Save 15% on your entire order",
    "discountCode": "SAVE15",
    "discountPercentage": 15,
    "delaySeconds": 3,
    "showOnce": false,
    "template": "discount"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": { /* Updated settings object */ }
}
```

### Analytics

#### Get Analytics Data
```http
GET /api/stayboost/analytics?shop={shop}&period={period}
```

**Parameters:**
- `shop` (required): Shop domain
- `period` (optional): Time period (24h, 7d, 30d, 90d) - default: 7d
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "summary": {
    "impressions": 15420,
    "conversions": 1854,
    "conversionRate": 12.02,
    "revenue": 18640.50,
    "averageOrderValue": 125.30
  },
  "timeline": [
    {
      "date": "2024-01-01",
      "impressions": 1250,
      "conversions": 150,
      "revenue": 1875.00
    }
  ],
  "devices": {
    "desktop": { "impressions": 9250, "conversions": 1110 },
    "mobile": { "impressions": 6170, "conversions": 744 }
  },
  "countries": {
    "US": { "impressions": 8500, "conversions": 1020 },
    "CA": { "impressions": 3200, "conversions": 384 }
  }
}
```

#### Export Analytics
```http
GET /api/stayboost/analytics/export?shop={shop}&format={format}&period={period}
```

**Parameters:**
- `shop` (required): Shop domain
- `format` (required): Export format (csv, pdf, excel)
- `period` (optional): Time period - default: 30d

**Response:**
- CSV/Excel: File download
- PDF: Binary PDF content

### A/B Testing

#### Create A/B Test
```http
POST /api/stayboost/ab-tests
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "name": "Holiday Popup Test",
  "description": "Testing holiday-themed vs. standard popup",
  "variants": [
    {
      "id": "control",
      "name": "Standard Popup",
      "traffic": 50,
      "settings": {
        "title": "Don't leave yet!",
        "template": "standard"
      }
    },
    {
      "id": "holiday",
      "name": "Holiday Popup",
      "traffic": 50,
      "settings": {
        "title": "Holiday Special!",
        "template": "seasonal"
      }
    }
  ],
  "duration": 14,
  "successMetric": "conversion_rate",
  "minimumSampleSize": 1000
}
```

**Response:**
```json
{
  "success": true,
  "testId": "test_123456",
  "status": "active",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-15T00:00:00Z"
}
```

#### Get A/B Test Results
```http
GET /api/stayboost/ab-tests/{testId}/results
```

**Response:**
```json
{
  "testId": "test_123456",
  "status": "completed",
  "duration": 14,
  "results": {
    "control": {
      "impressions": 5000,
      "conversions": 550,
      "conversionRate": 11.0,
      "revenue": 6875.00,
      "confidence": 95.5
    },
    "holiday": {
      "impressions": 5000,
      "conversions": 650,
      "conversionRate": 13.0,
      "revenue": 8125.00,
      "confidence": 98.2
    }
  },
  "winner": "holiday",
  "statisticalSignificance": true,
  "recommendation": "Deploy holiday variant"
}
```

### Templates

#### Get Available Templates
```http
GET /api/stayboost/templates?shop={shop}
```

**Response:**
```json
{
  "templates": [
    {
      "id": "urgency",
      "name": "Urgency Template",
      "description": "Create urgency with limited-time offers",
      "category": "conversion",
      "preview": "https://cdn.example.com/templates/urgency-preview.png",
      "settings": {
        "title": "Limited Time Offer!",
        "message": "Only {{hours}} hours left!",
        "buttonText": "Claim Now",
        "backgroundColor": "#ff4444",
        "textColor": "#ffffff"
      }
    },
    {
      "id": "discount",
      "name": "Discount Template",
      "description": "Offer percentage or fixed discounts",
      "category": "promotion",
      "preview": "https://cdn.example.com/templates/discount-preview.png",
      "settings": {
        "title": "Special Discount!",
        "message": "Get {{discount}}% off your order",
        "buttonText": "Get Discount",
        "backgroundColor": "#00aa44",
        "textColor": "#ffffff"
      }
    }
  ]
}
```

#### Apply Template
```http
POST /api/stayboost/templates/apply
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "templateId": "urgency",
  "customizations": {
    "title": "Flash Sale!",
    "backgroundColor": "#ff6600",
    "discountPercentage": 20
  }
}
```

### Customer Segmentation

#### Get Segments
```http
GET /api/stayboost/segments?shop={shop}
```

**Response:**
```json
{
  "segments": [
    {
      "id": "high_value",
      "name": "High Value Customers",
      "description": "Customers with AOV > $200",
      "criteria": {
        "averageOrderValue": { "min": 200 },
        "orderCount": { "min": 2 }
      },
      "customerCount": 1250,
      "performance": {
        "conversionRate": 18.5,
        "averageOrderValue": 285.75
      }
    },
    {
      "id": "new_visitors",
      "name": "New Visitors",
      "description": "First-time website visitors",
      "criteria": {
        "visitCount": { "max": 1 },
        "isReturning": false
      },
      "customerCount": 5420,
      "performance": {
        "conversionRate": 8.2,
        "averageOrderValue": 95.50
      }
    }
  ]
}
```

#### Create Custom Segment
```http
POST /api/stayboost/segments
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "name": "Cart Abandoners",
  "description": "Users who added items but didn't complete purchase",
  "criteria": {
    "cartAbandonment": true,
    "daysSinceLastVisit": { "min": 1, "max": 7 },
    "cartValue": { "min": 50 }
  },
  "popupSettings": {
    "template": "urgency",
    "discountPercentage": 15,
    "message": "Complete your purchase and save 15%!"
  }
}
```

### Integrations

#### Get Available Integrations
```http
GET /api/stayboost/integrations?shop={shop}
```

**Response:**
```json
{
  "integrations": [
    {
      "id": "mailchimp",
      "name": "Mailchimp",
      "category": "email_marketing",
      "status": "connected",
      "lastSync": "2024-01-01T12:00:00Z",
      "settings": {
        "listId": "abc123",
        "autoSubscribe": true,
        "doubleOptin": false
      }
    },
    {
      "id": "google_analytics",
      "name": "Google Analytics",
      "category": "analytics",
      "status": "configured",
      "settings": {
        "trackingId": "GA-123456789",
        "ecommerce": true,
        "customEvents": true
      }
    }
  ]
}
```

#### Configure Integration
```http
POST /api/stayboost/integrations/{integrationId}/configure
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "settings": {
    "apiKey": "your-api-key",
    "listId": "subscriber-list-id",
    "autoSubscribe": true,
    "tagNewSubscribers": "stayboost-popup"
  }
}
```

## 📈 Advanced Analytics Endpoints

### Predictive Analytics
```http
GET /api/stayboost/analytics/predictive?shop={shop}&type={type}
```

**Types:**
- `conversion_probability`: Predict conversion likelihood
- `customer_lifetime_value`: Estimate CLV
- `churn_prediction`: Identify at-risk customers
- `optimal_timing`: Best times to show popup

### Revenue Attribution
```http
GET /api/stayboost/analytics/attribution?shop={shop}&model={model}
```

**Attribution Models:**
- `first_touch`: First interaction attribution
- `last_touch`: Last interaction attribution
- `multi_touch`: Multi-touch attribution
- `time_decay`: Time-decay attribution

### Custom Reports
```http
POST /api/stayboost/reports/custom
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "name": "Monthly Performance Report",
  "metrics": ["impressions", "conversions", "revenue"],
  "dimensions": ["date", "device", "country"],
  "filters": {
    "dateRange": "last_30_days",
    "devices": ["mobile", "desktop"]
  },
  "schedule": {
    "frequency": "monthly",
    "email": "admin@example.com",
    "format": "pdf"
  }
}
```

## 🔧 Webhook Events

StayBoost supports webhooks for real-time notifications of important events.

### Webhook Configuration
```http
POST /api/stayboost/webhooks
```

**Request Body:**
```json
{
  "shop": "example.myshopify.com",
  "url": "https://your-app.com/webhooks/stayboost",
  "events": [
    "popup.conversion",
    "ab_test.completed",
    "performance.threshold_exceeded"
  ],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

#### Popup Conversion
```json
{
  "event": "popup.conversion",
  "timestamp": "2024-01-01T12:00:00Z",
  "shop": "example.myshopify.com",
  "data": {
    "customerId": "customer_123",
    "orderId": "order_456",
    "orderValue": 125.50,
    "discountCode": "SAVE10",
    "template": "urgency",
    "device": "mobile",
    "country": "US"
  }
}
```

#### A/B Test Completed
```json
{
  "event": "ab_test.completed",
  "timestamp": "2024-01-15T00:00:00Z",
  "shop": "example.myshopify.com",
  "data": {
    "testId": "test_123456",
    "winner": "variant_b",
    "confidence": 95.5,
    "improvementRate": 18.2,
    "recommendation": "deploy_winner"
  }
}
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_SHOP",
    "message": "Shop domain is invalid or not found",
    "details": {
      "shop": "invalid.myshopify.com",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_SHOP` | 400 | Shop domain is invalid |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Internal server error |

## 📝 SDK and Libraries

### JavaScript SDK
```javascript
import StayBoost from '@stayboost/js-sdk';

const stayboost = new StayBoost({
  shop: 'example.myshopify.com',
  apiKey: 'your-api-key'
});

// Get analytics
const analytics = await stayboost.analytics.get({ period: '30d' });

// Update settings
await stayboost.settings.update({
  enabled: true,
  template: 'urgency',
  discountPercentage: 15
});
```

### PHP SDK
```php
use StayBoost\SDK\Client;

$stayboost = new Client([
    'shop' => 'example.myshopify.com',
    'api_key' => 'your-api-key'
]);

// Get analytics
$analytics = $stayboost->analytics()->get(['period' => '30d']);

// Create A/B test
$test = $stayboost->abTests()->create([
    'name' => 'Holiday Test',
    'variants' => [/* variants */]
]);
```

## 🔍 Testing and Development

### Sandbox Environment
```http
Base URL: https://sandbox-api.stayboost.com
```

### Test Shop Credentials
```
Shop: test-shop.myshopify.com
API Key: test_api_key_123456
Access Token: test_access_token_789
```

### Postman Collection
Download the complete Postman collection: [StayBoost API Collection](https://api.stayboost.com/postman/collection.json)

---

**API Version**: 1.0.0  
**Last Updated**: ${new Date().toISOString()}  
**Base URL**: https://api.stayboost.com  
**Support**: api-support@stayboost.com
