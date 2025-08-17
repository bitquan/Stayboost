import { json } from "@remix-run/node";

// Simple health check endpoint for basic system status
export async function loader({ request }) {
  const timestamp = new Date().toISOString();
  
  try {
    // Basic system checks without complex dependencies
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Check if basic modules can be imported
    let systemStatus = 'healthy';
    const checks = [];
    
    // Memory check
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    checks.push({
      name: 'memory',
      status: memoryUsageMB < 500 ? 'healthy' : 'warning',
      message: `Memory usage: ${memoryUsageMB}MB`,
      details: { memoryUsageMB, uptime: Math.round(uptime) }
    });
    
    // Basic server check
    checks.push({
      name: 'server',
      status: 'healthy', 
      message: 'Server is responding',
      details: { nodeVersion: process.version, platform: process.platform }
    });
    
    // Database check (simple)
    try {
      const prismaModule = await import('../db.server.js');
      const prisma = prismaModule.default;
      
      if (prisma) {
        checks.push({
          name: 'database_connection',
          status: 'healthy',
          message: 'Database client available',
          details: { prismaClient: 'loaded' }
        });
      } else {
        checks.push({
          name: 'database_connection',
          status: 'warning',
          message: 'Database client unavailable',
          details: { prismaClient: 'null' }
        });
        systemStatus = 'warning';
      }
    } catch (dbError) {
      checks.push({
        name: 'database_connection',
        status: 'critical',
        message: 'Database import failed',
        details: { error: dbError.message }
      });
      systemStatus = 'critical';
    }
    
    return json({
      status: systemStatus,
      timestamp,
      message: 'Simple health check completed',
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        warning: checks.filter(c => c.status === 'warning').length,
        critical: checks.filter(c => c.status === 'critical').length
      },
      uptime: Math.round(uptime),
      version: '1.0.0'
    });
    
  } catch (error) {
    return json({
      status: 'critical',
      timestamp,
      error: 'Simple health check failed',
      details: error.message
    }, { status: 500 });
  }
}
