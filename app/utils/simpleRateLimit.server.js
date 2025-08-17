// Simple in-memory rate limiting for Remix (no external dependencies)

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Rate limit configurations
export const rateLimitConfigs = {
  general: { windowMs: 15 * 60 * 1000, max: 100 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
  analytics: { windowMs: 1 * 60 * 1000, max: 60 },
  settings: { windowMs: 1 * 60 * 1000, max: 30 },
  public: { windowMs: 1 * 60 * 1000, max: 200 },
  health: { windowMs: 1 * 60 * 1000, max: 60 }, // Health checks can be more frequent
  admin: { windowMs: 5 * 60 * 1000, max: 50 }, // Admin operations
};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Get rate limit data for a key
function getRateLimitData(key, windowMs) {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now > data.resetTime) {
    const newData = {
      count: 0,
      resetTime: now + windowMs,
      firstRequest: now,
    };
    rateLimitStore.set(key, newData);
    return newData;
  }

  return data;
}

// Check if request is rate limited
export async function checkRateLimit(request, configName = 'general') {
  try {
    const config = rateLimitConfigs[configName] || rateLimitConfigs.general;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Use shop domain if available, otherwise IP
    const url = new URL(request.url);
    const shop = url.searchParams.get('shop');
    const key = shop ? `shop:${shop}` : `ip:${ip}`;
    
    const data = getRateLimitData(key, config.windowMs);
    data.count++;
    
    if (data.count > config.max) {
      return {
        rateLimited: true,
        status: 429,
        message: {
          error: "Too many requests, please try again later.",
          retryAfter: Math.ceil((data.resetTime - Date.now()) / 1000),
        },
      };
    }
    
    return { rateLimited: false };
  } catch (error) {
    // Log error without Sentry dependency for now
    console.error('Rate limit check error:', error);
    return { rateLimited: false }; // Allow request on error
  }
}

// Rate limit info for client
export function getRateLimitInfo(configName = 'general') {
  const config = rateLimitConfigs[configName] || rateLimitConfigs.general;
  return {
    windowMs: config.windowMs,
    max: config.max,
  };
}

// Simple rate limit middleware
export function withRateLimit(configName = 'general') {
  return async (request) => {
    return await checkRateLimit(request, configName);
  };
}
