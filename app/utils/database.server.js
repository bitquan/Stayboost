// Database connection pool monitoring and health checks
import prisma from "../db.server.js";

// Database connection pool metrics
export async function getDatabaseMetrics() {
  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const queryTime = Date.now() - startTime;
    
    // Get connection pool info (if available)
    const metrics = {
      status: "healthy",
      connection_time_ms: queryTime,
      timestamp: new Date().toISOString(),
      database_type: process.env.DATABASE_URL?.includes("postgresql") ? "postgresql" : 
                     process.env.DATABASE_URL?.includes("mysql") ? "mysql" : "sqlite",
      pool_info: {
        // These would be available with PostgreSQL/MySQL
        active_connections: "N/A (SQLite)",
        idle_connections: "N/A (SQLite)", 
        max_connections: process.env.NODE_ENV === "production" ? 10 : 5,
      }
    };

    return metrics;
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
      connection_time_ms: null,
    };
  }
}

// Test database connection with timeout
export async function testDatabaseConnection(timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Database connection timeout")), timeoutMs);
  });

  const connectionPromise = prisma.$queryRaw`SELECT 1 as health_check`;

  try {
    await Promise.race([connectionPromise, timeoutPromise]);
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

// Database connection pool health check
export async function connectionPoolHealthCheck() {
  try {
    const startTime = performance.now();
    
    // Execute multiple concurrent queries to test pool
    const concurrentQueries = Array(3).fill().map(() => 
      prisma.$queryRaw`SELECT datetime('now') as current_time`
    );
    
    const results = await Promise.all(concurrentQueries);
    const totalTime = performance.now() - startTime;
    
    return {
      status: "healthy",
      concurrent_queries: concurrentQueries.length,
      total_time_ms: Math.round(totalTime * 100) / 100,
      average_time_ms: Math.round((totalTime / concurrentQueries.length) * 100) / 100,
      all_queries_successful: results.every(r => r.length > 0),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// Clean up stale sessions (example of connection pool usage)
export async function cleanupStaleConnections() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const result = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: oneHourAgo
        }
      }
    });
    
    return {
      success: true,
      deleted_sessions: result.count,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
