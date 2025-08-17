// Public health check endpoint - minimal response for monitoring systems
export async function loader({ request }) {
  const startTime = Date.now();
  
  try {
    // Basic system availability check
    const uptime = process.uptime();
    const responseTime = Date.now() - startTime;
    
    // Simple status response for load balancers/monitoring
    return new Response('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'healthy',
        'X-Response-Time': `${responseTime}ms`,
        'X-Uptime': `${Math.round(uptime)}s`
      }
    });
    
  } catch (error) {
    return new Response('ERROR', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'X-Health-Status': 'unhealthy',
        'X-Error': error.message
      }
    });
  }
}
