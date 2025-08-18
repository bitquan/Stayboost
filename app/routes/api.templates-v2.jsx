// StayBoost Template API v2 - Enhanced with better performance and advanced features
import { PrismaClient } from '@prisma/client';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server.js';

const prisma = new PrismaClient();

// Enhanced caching system
const CACHE_DURATION = {
  templates: 5 * 60 * 1000, // 5 minutes
  categories: 15 * 60 * 1000, // 15 minutes
  analytics: 2 * 60 * 1000, // 2 minutes
  search: 30 * 1000 // 30 seconds
};

const cache = new Map();

// Rate limiting per shop
const rateLimits = new Map();
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000 // 1 minute
};

// Performance monitoring
const performanceMetrics = {
  totalRequests: 0,
  averageResponseTime: 0,
  cacheHitRate: 0,
  errorRate: 0
};

// Enhanced template categories with metadata
const ENHANCED_CATEGORIES = {
  exit_intent: {
    name: 'Exit Intent',
    description: 'Capture abandoning visitors',
    icon: 'ExitIcon',
    priority: 90,
    avgConversionRate: 12.5,
    usage: 'high'
  },
  sales: {
    name: 'Sales & Promotions',
    description: 'Boost sales with targeted offers',
    icon: 'DiscountIcon',
    priority: 85,
    avgConversionRate: 15.2,
    usage: 'high'
  },
  seasonal: {
    name: 'Seasonal Campaigns',
    description: 'Holiday and seasonal promotions',
    icon: 'CalendarIcon',
    priority: 80,
    avgConversionRate: 18.7,
    usage: 'medium'
  },
  newsletter: {
    name: 'Email Capture',
    description: 'Grow your email list',
    icon: 'EmailIcon',
    priority: 75,
    avgConversionRate: 8.9,
    usage: 'medium'
  },
  announcement: {
    name: 'Announcements',
    description: 'Share important updates',
    icon: 'SpeakerIcon',
    priority: 70,
    avgConversionRate: 6.3,
    usage: 'low'
  },
  survey: {
    name: 'Surveys & Feedback',
    description: 'Collect customer insights',
    icon: 'SurveyIcon',
    priority: 65,
    avgConversionRate: 4.1,
    usage: 'low'
  }
};

// Template quality scoring algorithm
function calculateTemplateQualityScore(template, analytics) {
  let score = 0;
  
  // Base score from template completeness
  const config = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;
  const requiredFields = ['title', 'message', 'buttonText'];
  const completeness = requiredFields.filter(field => config[field]).length / requiredFields.length;
  score += completeness * 30;
  
  // Performance score from analytics
  if (analytics?.conversionRate) {
    score += Math.min(analytics.conversionRate, 25) * 2; // Max 50 points
  }
  
  // Usage popularity score
  if (template.usageCount > 0) {
    score += Math.min(Math.log10(template.usageCount) * 10, 20); // Max 20 points
  }
  
  return Math.min(Math.round(score), 100);
}

// Enhanced search with AI-powered ranking
function enhancedTemplateSearch(templates, query, filters = {}) {
  if (!query && !Object.keys(filters).length) {
    return templates;
  }
  
  let results = [...templates];
  
  // Text search with weighted scoring
  if (query) {
    const searchTerms = query.toLowerCase().split(' ');
    results = results.map(template => {
      let relevanceScore = 0;
      const searchableText = [
        template.name,
        template.description,
        template.category,
        ...(template.tags ? JSON.parse(template.tags) : [])
      ].join(' ').toLowerCase();
      
      searchTerms.forEach(term => {
        if (template.name.toLowerCase().includes(term)) relevanceScore += 10;
        if (template.description?.toLowerCase().includes(term)) relevanceScore += 5;
        if (template.category.toLowerCase().includes(term)) relevanceScore += 8;
        if (searchableText.includes(term)) relevanceScore += 2;
      });
      
      return { ...template, relevanceScore };
    }).filter(template => template.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  // Apply filters
  if (filters.category) {
    results = results.filter(template => template.category === filters.category);
  }
  
  if (filters.templateType) {
    results = results.filter(template => template.templateType === filters.templateType);
  }
  
  if (filters.minRating) {
    results = results.filter(template => template.averageRating >= filters.minRating);
  }
  
  if (filters.isFeatured !== undefined) {
    results = results.filter(template => template.isFeatured === filters.isFeatured);
  }
  
  return results;
}

// Cache management functions
function getCacheKey(type, identifier) {
  return `${type}:${identifier}`;
}

function setCache(key, data, duration = CACHE_DURATION.templates) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    duration
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.duration) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function clearCache(pattern) {
  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

// Rate limiting check
function checkRateLimit(shop) {
  const now = Date.now();
  const shopLimits = rateLimits.get(shop) || { requests: [], blocked: false };
  
  // Remove old requests outside the window
  shopLimits.requests = shopLimits.requests.filter(timestamp => 
    now - timestamp < RATE_LIMIT.windowMs
  );
  
  if (shopLimits.requests.length >= RATE_LIMIT.maxRequests) {
    shopLimits.blocked = true;
    rateLimits.set(shop, shopLimits);
    return false;
  }
  
  shopLimits.requests.push(now);
  shopLimits.blocked = false;
  rateLimits.set(shop, shopLimits);
  return true;
}

// Performance tracking
function trackPerformance(startTime, success = true, fromCache = false) {
  const responseTime = Date.now() - startTime;
  performanceMetrics.totalRequests++;
  
  // Update average response time
  performanceMetrics.averageResponseTime = 
    (performanceMetrics.averageResponseTime * (performanceMetrics.totalRequests - 1) + responseTime) / 
    performanceMetrics.totalRequests;
  
  // Update cache hit rate
  if (fromCache) {
    performanceMetrics.cacheHitRate = 
      (performanceMetrics.cacheHitRate * (performanceMetrics.totalRequests - 1) + 100) / 
      performanceMetrics.totalRequests;
  }
  
  // Update error rate
  if (!success) {
    performanceMetrics.errorRate = 
      (performanceMetrics.errorRate * (performanceMetrics.totalRequests - 1) + 100) / 
      performanceMetrics.totalRequests;
  }
}

export const action = async ({ request }) => {
  const startTime = Date.now();
  const { session } = await authenticate.admin(request);
  const method = request.method;
  const url = new URL(request.url);
  
  try {
    // Rate limiting check
    if (!checkRateLimit(session.shop)) {
      trackPerformance(startTime, false);
      return json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: 60
      }, { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + RATE_LIMIT.windowMs).toString()
        }
      });
    }
    
    if (method === 'GET') {
      const action = url.searchParams.get('action');
      
      // Get API performance metrics
      if (action === 'metrics') {
        const metrics = {
          ...performanceMetrics,
          cacheSize: cache.size,
          uptime: process.uptime(),
          version: '2.0',
          features: [
            'Enhanced Caching',
            'Rate Limiting',
            'Performance Monitoring',
            'AI-Powered Search',
            'Quality Scoring',
            'Bulk Operations',
            'Real-time Analytics'
          ]
        };
        
        trackPerformance(startTime, true);
        return json({ metrics });
      }
      
      // Get enhanced categories with metadata
      if (action === 'categories') {
        const cacheKey = getCacheKey('categories', 'all');
        let categories = getCache(cacheKey);
        
        if (!categories) {
          // Get category usage statistics
          const categoryStats = await prisma.popupTemplate.groupBy({
            by: ['category'],
            where: {
              OR: [
                { shop: session.shop },
                { shop: null }
              ]
            },
            _count: {
              id: true
            },
            _avg: {
              averageRating: true,
              conversionRate: true
            }
          });
          
          categories = Object.entries(ENHANCED_CATEGORIES).map(([key, meta]) => {
            const stats = categoryStats.find(s => s.category === key);
            return {
              key,
              ...meta,
              templateCount: stats?._count.id || 0,
              avgRating: stats?._avg.averageRating || 0,
              avgConversion: stats?._avg.conversionRate || 0
            };
          });
          
          setCache(cacheKey, categories, CACHE_DURATION.categories);
        }
        
        trackPerformance(startTime, true, categories !== null);
        return json({ categories });
      }
      
      // Enhanced template search and filtering
      if (action === 'search') {
        const query = url.searchParams.get('q') || '';
        const category = url.searchParams.get('category');
        const templateType = url.searchParams.get('type');
        const minRating = url.searchParams.get('minRating');
        const isFeatured = url.searchParams.get('featured');
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const offset = parseInt(url.searchParams.get('offset')) || 0;
        const sortBy = url.searchParams.get('sort') || 'relevance';
        
        const cacheKey = getCacheKey('search', 
          `${query}-${category}-${templateType}-${minRating}-${isFeatured}-${limit}-${offset}-${sortBy}`
        );
        
        let searchResults = getCache(cacheKey);
        
        if (!searchResults) {
          // Get all templates with related data
          const templates = await prisma.popupTemplate.findMany({
            where: {
              OR: [
                { shop: session.shop },
                { shop: null }
              ]
            },
            include: {
              usageStats: {
                where: { shop: session.shop },
                orderBy: { date: 'desc' },
                take: 30
              },
              ratings: {
                where: { shop: session.shop }
              },
              favorites: {
                where: { shop: session.shop }
              },
              translations: {
                where: { shop: session.shop }
              }
            }
          });
          
          // Apply enhanced search and filtering
          const filters = {
            category,
            templateType,
            minRating: minRating ? parseFloat(minRating) : undefined,
            isFeatured: isFeatured ? isFeatured === 'true' : undefined
          };
          
          let filteredTemplates = enhancedTemplateSearch(templates, query, filters);
          
          // Calculate quality scores
          filteredTemplates = filteredTemplates.map(template => {
            const analytics = template.usageStats.length > 0 ? {
              conversionRate: template.usageStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / template.usageStats.length,
              totalImpressions: template.usageStats.reduce((sum, stat) => sum + stat.impressions, 0),
              totalConversions: template.usageStats.reduce((sum, stat) => sum + stat.conversions, 0)
            } : null;
            
            return {
              ...template,
              qualityScore: calculateTemplateQualityScore(template, analytics),
              analytics,
              isFavorite: template.favorites.length > 0,
              translationCount: template.translations.length
            };
          });
          
          // Apply sorting
          switch (sortBy) {
            case 'quality':
              filteredTemplates.sort((a, b) => b.qualityScore - a.qualityScore);
              break;
            case 'rating':
              filteredTemplates.sort((a, b) => b.averageRating - a.averageRating);
              break;
            case 'usage':
              filteredTemplates.sort((a, b) => b.usageCount - a.usageCount);
              break;
            case 'recent':
              filteredTemplates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
              break;
            case 'name':
              filteredTemplates.sort((a, b) => a.name.localeCompare(b.name));
              break;
            default: // relevance
              // Already sorted by relevance in search function
              break;
          }
          
          // Apply pagination
          const total = filteredTemplates.length;
          const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);
          
          searchResults = {
            templates: paginatedTemplates,
            pagination: {
              total,
              limit,
              offset,
              hasNext: offset + limit < total,
              hasPrevious: offset > 0
            },
            searchMeta: {
              query,
              filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)),
              sortBy,
              executionTime: Date.now() - startTime
            }
          };
          
          setCache(cacheKey, searchResults, CACHE_DURATION.search);
        }
        
        trackPerformance(startTime, true, searchResults !== null);
        return json(searchResults);
      }
      
      // Get template recommendations based on AI analysis
      if (action === 'recommendations') {
        const context = url.searchParams.get('context') || 'general';
        const limit = parseInt(url.searchParams.get('limit')) || 5;
        
        const cacheKey = getCacheKey('recommendations', `${session.shop}-${context}-${limit}`);
        let recommendations = getCache(cacheKey);
        
        if (!recommendations) {
          // Get shop's template usage history
          const usageHistory = await prisma.templateUsageStats.findMany({
            where: { shop: session.shop },
            include: {
              template: true
            },
            orderBy: { date: 'desc' },
            take: 100
          });
          
          // Get all available templates
          const allTemplates = await prisma.popupTemplate.findMany({
            where: {
              OR: [
                { shop: session.shop },
                { shop: null }
              ]
            },
            include: {
              usageStats: true
            }
          });
          
          // AI-powered recommendation algorithm
          const usedCategories = [...new Set(usageHistory.map(h => h.template.category))];
          const unusedTemplates = allTemplates.filter(template => 
            !usageHistory.some(h => h.template.id === template.id)
          );
          
          // Score templates based on multiple factors
          const scoredTemplates = unusedTemplates.map(template => {
            let score = 0;
            
            // Category affinity (if shop uses similar categories)
            if (usedCategories.includes(template.category)) score += 30;
            
            // Global performance
            const globalStats = template.usageStats;
            if (globalStats.length > 0) {
              const avgConversion = globalStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / globalStats.length;
              score += Math.min(avgConversion * 2, 40);
            }
            
            // Template quality
            score += calculateTemplateQualityScore(template) * 0.3;
            
            // Recency and trending
            if (template.isFeatured) score += 15;
            if (template.templateType === 'built_in') score += 10;
            
            // Context-specific scoring
            if (context === 'seasonal' && template.category.includes('seasonal')) score += 25;
            if (context === 'sales' && ['sales', 'flash_sale', 'clearance'].includes(template.category)) score += 25;
            if (context === 'engagement' && ['newsletter', 'survey'].includes(template.category)) score += 25;
            
            return {
              ...template,
              recommendationScore: score,
              reason: generateRecommendationReason(template, score, context)
            };
          });
          
          recommendations = scoredTemplates
            .sort((a, b) => b.recommendationScore - a.recommendationScore)
            .slice(0, limit);
          
          setCache(cacheKey, recommendations, CACHE_DURATION.templates);
        }
        
        trackPerformance(startTime, true, recommendations !== null);
        return json({ recommendations });
      }
      
      // Enhanced analytics with predictive insights
      if (action === 'analytics') {
        const period = url.searchParams.get('period') || '30d';
        const templateId = url.searchParams.get('templateId');
        
        const cacheKey = getCacheKey('analytics', `${session.shop}-${period}-${templateId}`);
        let analytics = getCache(cacheKey);
        
        if (!analytics) {
          const dateFilter = getPeriodDateFilter(period);
          
          const whereClause = {
            shop: session.shop,
            date: dateFilter
          };
          
          if (templateId) {
            whereClause.templateId = parseInt(templateId);
          }
          
          const [stats, trends, predictions] = await Promise.all([
            // Current period stats
            prisma.templateUsageStats.aggregate({
              where: whereClause,
              _sum: {
                impressions: true,
                conversions: true,
                revenue: true
              },
              _avg: {
                conversionRate: true
              }
            }),
            
            // Trend analysis
            prisma.templateUsageStats.findMany({
              where: whereClause,
              orderBy: { date: 'asc' },
              select: {
                date: true,
                impressions: true,
                conversions: true,
                conversionRate: true,
                revenue: true
              }
            }),
            
            // Predictive analysis (simplified)
            generatePredictiveInsights(session.shop, period)
          ]);
          
          analytics = {
            summary: {
              totalImpressions: stats._sum.impressions || 0,
              totalConversions: stats._sum.conversions || 0,
              totalRevenue: stats._sum.revenue || 0,
              averageConversionRate: stats._avg.conversionRate || 0
            },
            trends,
            predictions,
            insights: generateAnalyticsInsights(stats, trends),
            period,
            generatedAt: new Date().toISOString()
          };
          
          setCache(cacheKey, analytics, CACHE_DURATION.analytics);
        }
        
        trackPerformance(startTime, true, analytics !== null);
        return json({ analytics });
      }
      
      // Default: Get all templates with enhanced data
      const cacheKey = getCacheKey('templates', session.shop);
      let templates = getCache(cacheKey);
      
      if (!templates) {
        templates = await prisma.popupTemplate.findMany({
          where: {
            OR: [
              { shop: session.shop },
              { shop: null }
            ]
          },
          include: {
            usageStats: {
              where: { shop: session.shop },
              orderBy: { date: 'desc' },
              take: 5
            },
            ratings: {
              where: { shop: session.shop }
            },
            favorites: {
              where: { shop: session.shop }
            }
          },
          orderBy: [
            { isFeatured: 'desc' },
            { averageRating: 'desc' },
            { usageCount: 'desc' }
          ]
        });
        
        // Enhance templates with computed data
        templates = templates.map(template => {
          const recentStats = template.usageStats[0];
          return {
            ...template,
            qualityScore: calculateTemplateQualityScore(template, recentStats),
            isFavorite: template.favorites.length > 0,
            recentPerformance: recentStats ? {
              conversionRate: recentStats.conversionRate,
              impressions: recentStats.impressions,
              conversions: recentStats.conversions
            } : null
          };
        });
        
        setCache(cacheKey, templates);
      }
      
      trackPerformance(startTime, true, templates !== null);
      return json({ 
        templates,
        meta: {
          version: '2.0',
          cached: templates !== null,
          responseTime: Date.now() - startTime
        }
      });
    }
    
    // POST: Bulk operations
    if (method === 'POST') {
      const body = await request.json();
      const { action: bulkAction, templateIds, operation } = body;
      
      if (bulkAction === 'bulk') {
        if (!templateIds || !Array.isArray(templateIds) || !operation) {
          return json({ error: 'templateIds array and operation are required' }, { status: 400 });
        }
        
        let results = [];
        
        switch (operation) {
          case 'favorite':
            for (const templateId of templateIds) {
              try {
                await prisma.templateFavorites.upsert({
                  where: {
                    shop_templateId: {
                      shop: session.shop,
                      templateId: parseInt(templateId)
                    }
                  },
                  create: {
                    shop: session.shop,
                    templateId: parseInt(templateId)
                  },
                  update: {}
                });
                results.push({ templateId, success: true });
              } catch (error) {
                results.push({ templateId, success: false, error: error.message });
              }
            }
            break;
            
          case 'unfavorite':
            for (const templateId of templateIds) {
              try {
                await prisma.templateFavorites.deleteMany({
                  where: {
                    shop: session.shop,
                    templateId: parseInt(templateId)
                  }
                });
                results.push({ templateId, success: true });
              } catch (error) {
                results.push({ templateId, success: false, error: error.message });
              }
            }
            break;
            
          case 'delete':
            // Only allow deletion of custom templates
            for (const templateId of templateIds) {
              try {
                const template = await prisma.popupTemplate.findFirst({
                  where: {
                    id: parseInt(templateId),
                    shop: session.shop,
                    templateType: 'custom'
                  }
                });
                
                if (template) {
                  await prisma.popupTemplate.delete({
                    where: { id: parseInt(templateId) }
                  });
                  results.push({ templateId, success: true });
                } else {
                  results.push({ templateId, success: false, error: 'Template not found or not deletable' });
                }
              } catch (error) {
                results.push({ templateId, success: false, error: error.message });
              }
            }
            break;
            
          default:
            return json({ error: 'Invalid bulk operation' }, { status: 400 });
        }
        
        // Clear relevant caches
        clearCache(session.shop);
        
        trackPerformance(startTime, true);
        return json({ 
          success: true, 
          results,
          summary: {
            total: templateIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        });
      }
    }
    
    return json({ error: 'Method not allowed' }, { status: 405 });
    
  } catch (error) {
    console.error('Template API v2 error:', error);
    trackPerformance(startTime, false);
    return json({ 
      error: 'Internal server error',
      message: error.message,
      version: '2.0'
    }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  return action({ request });
};

// Helper functions
function generateRecommendationReason(template, score, context) {
  const reasons = [];
  
  if (score > 80) reasons.push("Highly recommended based on performance data");
  if (template.isFeatured) reasons.push("Featured template with proven results");
  if (template.averageRating > 4.5) reasons.push("Excellent user ratings");
  if (template.usageCount > 100) reasons.push("Popular choice among merchants");
  
  if (context === 'seasonal' && template.category.includes('seasonal')) {
    reasons.push("Perfect for seasonal campaigns");
  }
  
  return reasons.length > 0 ? reasons[0] : "Good match for your store";
}

function getPeriodDateFilter(period) {
  const now = new Date();
  const filters = {
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  };
  
  return { gte: filters[period] || filters['30d'] };
}

async function generatePredictiveInsights(shop, period) {
  // Simplified predictive analysis
  try {
    const historicalData = await prisma.templateUsageStats.findMany({
      where: { 
        shop,
        date: getPeriodDateFilter(period)
      },
      orderBy: { date: 'asc' }
    });
    
    if (historicalData.length < 7) {
      return { message: "Insufficient data for predictions" };
    }
    
    // Simple trend analysis
    const recentData = historicalData.slice(-7);
    const olderData = historicalData.slice(-14, -7);
    
    const recentAvg = recentData.reduce((sum, d) => sum + d.conversionRate, 0) / recentData.length;
    const olderAvg = olderData.length > 0 ? olderData.reduce((sum, d) => sum + d.conversionRate, 0) / olderData.length : recentAvg;
    
    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
      trendPercentage: Math.round(trend * 100) / 100,
      predictedConversionRate: Math.max(0, recentAvg + (trend / 100) * recentAvg),
      confidence: historicalData.length > 30 ? 'high' : 'medium'
    };
  } catch (error) {
    return { error: 'Unable to generate predictions' };
  }
}

function generateAnalyticsInsights(stats, trends) {
  const insights = [];
  
  if (stats._avg.conversionRate > 0.15) {
    insights.push({
      type: 'positive',
      message: 'Excellent conversion rate performance',
      action: 'Consider expanding successful campaigns'
    });
  } else if (stats._avg.conversionRate < 0.05) {
    insights.push({
      type: 'warning',
      message: 'Conversion rate needs improvement',
      action: 'Review template content and targeting'
    });
  }
  
  if (trends.length > 7) {
    const recentTrend = trends.slice(-7);
    const avgRecentConversions = recentTrend.reduce((sum, t) => sum + t.conversions, 0) / 7;
    
    if (avgRecentConversions > 10) {
      insights.push({
        type: 'positive',
        message: 'Strong recent performance',
        action: 'Maintain current strategy'
      });
    }
  }
  
  return insights;
}
