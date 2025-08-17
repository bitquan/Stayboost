import { PrismaClient } from "@prisma/client";

// Database connection pooling configuration
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || "file:dev.sqlite";
  
  // Add connection pooling parameters for production databases
  if (process.env.NODE_ENV === "production" && !url.includes("file:")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}connection_limit=10&pool_timeout=20`;
  }
  
  return url;
};

// Prisma client configuration with connection pooling
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    // Connection pooling and optimization settings
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    
    // Configure connection pool for production
    __internal: {
      engine: {
        // Connection pooling settings
        connection_limit: process.env.NODE_ENV === "production" ? 10 : 5,
        pool_timeout: 20,
        schema_poll_interval: 2000,
      },
    },
  });
};

// Global Prisma instance with connection pooling
let prisma;

if (process.env.NODE_ENV === "production") {
  // In production, create a new instance
  prisma = createPrismaClient();
} else {
  // In development, use global to prevent connection leaks during hot reloads
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

// Graceful shutdown handling
const gracefulShutdown = () => {
  prisma.$disconnect().catch((error) => {
    console.error("Error during Prisma disconnect:", error);
  });
};

// Register shutdown handlers
if (typeof process !== "undefined") {
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
  process.on("beforeExit", gracefulShutdown);
}

export default prisma;
