# Template API v2 - Enhanced Performance & Features

## Overview

Template API v2 represents a major advancement in StayBoost's template management system, introducing enterprise-grade performance optimizations, AI-powered features, and comprehensive analytics capabilities.

## Key Features

### 🚀 Performance Enhancements
- **Intelligent Caching System**: Multi-layered caching with configurable TTLs
- **Rate Limiting**: Per-shop rate limiting with 100 requests/minute default
- **Response Optimization**: Sub-100ms average response times
- **Background Processing**: Asynchronous operations for bulk actions

### 🎯 AI-Powered Capabilities
- **Smart Recommendations**: Context-aware template suggestions
- **Quality Scoring**: Automated template quality assessment (0-100 scale)
- **Predictive Analytics**: Trend analysis with confidence intervals
- **Performance Insights**: Actionable recommendations based on data

### 🔍 Enhanced Search & Filtering
- **Fuzzy Search**: Weighted relevance scoring across multiple fields
- **Advanced Filtering**: Category, type, rating, and performance filters
- **Pagination**: Efficient result pagination with metadata
- **Sort Options**: Multiple sorting algorithms (relevance, quality, usage, etc.)

### 📊 Advanced Analytics
- **Real-time Metrics**: Live performance tracking
- **Trend Analysis**: Historical data analysis with predictions
- **Conversion Tracking**: Detailed conversion funnel analysis
- **Revenue Attribution**: Revenue tracking per template

### 🔧 Bulk Operations
- **Multi-template Actions**: Bulk favorite/unfavorite/delete operations
- **Error Handling**: Graceful error handling with detailed reporting
- **Progress Tracking**: Real-time bulk operation progress
- **Rollback Support**: Safe operation rollback capabilities

## API Endpoints

### GET /api/templates-v2

#### Base Template Retrieval
```
GET /api/templates-v2
```
Returns enhanced templates with quality scores, favorites status, and performance data.

#### Performance Metrics
```
GET /api/templates-v2?action=metrics
```
Returns API performance statistics and feature list.

#### Enhanced Categories
```
GET /api/templates-v2?action=categories
```
Returns category metadata with usage statistics and performance data.

#### Advanced Search
```
GET /api/templates-v2?action=search&q=query&category=exit_intent&sort=quality
```
**Parameters:**
- `q`: Search query (fuzzy search across name, description, tags)
- `category`: Filter by category
- `type`: Filter by template type (built_in, custom)
- `minRating`: Minimum rating filter
- `featured`: Filter featured templates
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset
- `sort`: Sort order (relevance, quality, rating, usage, recent, name)

#### AI Recommendations
```
GET /api/templates-v2?action=recommendations&context=seasonal&limit=10
```
**Parameters:**
- `context`: Recommendation context (general, seasonal, sales, engagement)
- `limit`: Number of recommendations (default: 5)

#### Advanced Analytics
```
GET /api/templates-v2?action=analytics&period=30d&templateId=123
```
**Parameters:**
- `period`: Analysis period (7d, 30d, 90d, 1y)
- `templateId`: Specific template analysis (optional)

### POST /api/templates-v2

#### Bulk Operations
```json
{
  "action": "bulk",
  "templateIds": [1, 2, 3],
  "operation": "favorite"
}
```
**Operations:**
- `favorite`: Add templates to favorites
- `unfavorite`: Remove from favorites
- `delete`: Delete custom templates

## Response Formats

### Template Object (Enhanced)
```json
{
  "id": 1,
  "name": "Exit Intent Classic",
  "description": "Classic exit intent popup",
  "category": "exit_intent",
  "templateType": "built_in",
  "config": {
    "title": "Wait! Don't leave yet!",
    "message": "Get 10% off your first order",
    "buttonText": "Claim Offer"
  },
  "averageRating": 4.5,
  "usageCount": 150,
  "isFeatured": true,
  "qualityScore": 85,
  "isFavorite": false,
  "recentPerformance": {
    "conversionRate": 0.15,
    "impressions": 1000,
    "conversions": 150
  },
  "translationCount": 5
}
```

### Search Results
```json
{
  "templates": [...],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasNext": true,
    "hasPrevious": false
  },
  "searchMeta": {
    "query": "exit intent",
    "filters": {
      "category": "exit_intent"
    },
    "sortBy": "relevance",
    "executionTime": 23
  }
}
```

### Recommendations
```json
{
  "recommendations": [
    {
      "id": 1,
      "name": "Summer Sale Popup",
      "category": "seasonal",
      "recommendationScore": 92,
      "reason": "Perfect for seasonal campaigns",
      "averageRating": 4.7
    }
  ]
}
```

### Analytics Data
```json
{
  "analytics": {
    "summary": {
      "totalImpressions": 50000,
      "totalConversions": 6000,
      "totalRevenue": 120000,
      "averageConversionRate": 0.12
    },
    "trends": [...],
    "predictions": {
      "trend": "improving",
      "trendPercentage": 8.5,
      "predictedConversionRate": 0.13,
      "confidence": "high"
    },
    "insights": [
      {
        "type": "positive",
        "message": "Excellent conversion rate performance",
        "action": "Consider expanding successful campaigns"
      }
    ]
  }
}
```

## Quality Scoring Algorithm

The quality score (0-100) is calculated using:

### Template Completeness (30 points)
- Required fields present (title, message, buttonText)
- Additional configuration completeness

### Performance Score (50 points)
- Conversion rate performance (up to 25% = 50 points)
- Historical performance data

### Popularity Score (20 points)
- Usage count (logarithmic scale)
- Community ratings and feedback

## Caching Strategy

### Cache Layers
1. **Template Cache**: 5 minutes TTL
2. **Category Cache**: 15 minutes TTL
3. **Analytics Cache**: 2 minutes TTL
4. **Search Cache**: 30 seconds TTL

### Cache Keys
- `templates:{shop}`: Shop-specific templates
- `categories:all`: Global categories with stats
- `search:{query}-{filters}-{sort}`: Search results
- `analytics:{shop}-{period}`: Analytics data
- `recommendations:{shop}-{context}`: AI recommendations

## Rate Limiting

### Default Limits
- **Requests per minute**: 100
- **Burst limit**: 120
- **Window**: 60 seconds

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60 (when limited)
```

## Error Handling

### Standard Error Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60,
  "version": "2.0"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `429`: Rate Limited
- `500`: Internal Server Error

## Performance Metrics

### Real-time Monitoring
- Total requests processed
- Average response time
- Cache hit rate
- Error rate
- Active connections

### Optimization Features
- Automatic query optimization
- Result set limiting
- Efficient pagination
- Background processing
- Memory-efficient caching

## Security Features

### Authentication
- Shopify Admin API authentication required
- Session-based access control
- Rate limiting per shop

### Input Validation
- SQL injection prevention
- XSS protection
- Input sanitization
- Parameter validation

### Data Protection
- Secure data transmission
- Privacy-compliant logging
- Minimal data retention
- GDPR compliance

## Integration Examples

### Frontend Integration
```javascript
// Enhanced search with AI recommendations
const searchTemplates = async (query, filters) => {
  const params = new URLSearchParams({
    action: 'search',
    q: query,
    ...filters
  });
  
  const response = await fetch(`/api/templates-v2?${params}`);
  const data = await response.json();
  
  return data;
};

// Get AI recommendations
const getRecommendations = async (context = 'general') => {
  const response = await fetch(
    `/api/templates-v2?action=recommendations&context=${context}`
  );
  return response.json();
};

// Bulk operations
const bulkFavorite = async (templateIds) => {
  const response = await fetch('/api/templates-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'bulk',
      templateIds,
      operation: 'favorite'
    })
  });
  
  return response.json();
};
```

### Analytics Integration
```javascript
// Advanced analytics
const getAnalytics = async (period = '30d') => {
  const response = await fetch(
    `/api/templates-v2?action=analytics&period=${period}`
  );
  const { analytics } = await response.json();
  
  return analytics;
};
```

## Migration from API v1

### Breaking Changes
- New response format with enhanced metadata
- Quality scoring system
- Enhanced search parameters
- Bulk operation format changes

### Backward Compatibility
- Core template structure maintained
- Basic GET requests still supported
- Gradual migration path available

## Future Enhancements

### Planned Features
- GraphQL endpoint support
- Webhook notifications
- Advanced A/B testing integration
- Machine learning recommendations
- Real-time collaboration features

### Performance Targets
- Sub-50ms average response time
- 99.9% uptime
- 95%+ cache hit rate
- Support for 1000+ concurrent requests

## Demo Interface

Access the Template API v2 demo at `/app/api-v2` to explore:
- Performance metrics dashboard
- Enhanced search interface
- AI recommendation system
- Advanced analytics visualization
- Bulk operation tools

---

**Template API v2** - Powering the next generation of StayBoost template management with enterprise-grade performance and AI-driven insights.
