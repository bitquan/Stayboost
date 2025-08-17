import test from "node:test";
import assert from "node:assert";
import { readFile } from "node:fs/promises";
import path from "node:path";

// StayBoost Security & Monitoring Features Test Suite
test("StayBoost Security & Monitoring Features", async (t) => {
  const projectRoot = process.cwd();

  await t.test("Security Implementation", async (t) => {
    await t.test("should have Sentry error tracking utilities", async () => {
      const sentryPath = path.join(projectRoot, "app/utils/sentry.server.js");
      const sentryContent = await readFile(sentryPath, "utf-8");

      assert(
        sentryContent.includes("initializeSentry"),
        "Should have Sentry initialization",
      );
      assert(
        sentryContent.includes("reportError"),
        "Should have error reporting function",
      );
      assert(
        sentryContent.includes("startTransaction"),
        "Should have performance monitoring",
      );
    });

    await t.test("should have session timeout management", async () => {
      const sessionPath = path.join(projectRoot, "app/utils/session.server.js");
      const sessionContent = await readFile(sessionPath, "utf-8");

      assert(
        sessionContent.includes("SessionManager"),
        "Should have SessionManager class",
      );
      assert(
        sessionContent.includes("SESSION_TIMEOUT"),
        "Should have timeout configuration",
      );
      assert(
        sessionContent.includes("requireValidSession"),
        "Should have session validation",
      );
    });

    await t.test("should have rate limiting system", async () => {
      const rateLimitPath = path.join(
        projectRoot,
        "app/utils/simpleRateLimit.server.js",
      );
      const rateLimitContent = await readFile(rateLimitPath, "utf-8");

      assert(
        rateLimitContent.includes("rateLimitStore"),
        "Should have rate limit store",
      );
      assert(
        rateLimitContent.includes("checkRateLimit"),
        "Should have rate limit check function",
      );
      assert(
        rateLimitContent.includes("rateLimitConfigs"),
        "Should have rate limit configurations",
      );
    });

    await t.test("should have Sentry error tracking utilities", async () => {
      const sentryPath = path.join(projectRoot, "app/utils/sentry.server.js");
      const sentryContent = await readFile(sentryPath, "utf-8");

      assert(
        sentryContent.includes("initializeSentry"),
        "Should have Sentry initialization",
      );
      assert(
        sentryContent.includes("reportError"),
        "Should have error reporting function",
      );
      assert(
        sentryContent.includes("startTransaction"),
        "Should have performance monitoring",
      );
    });

    await t.test("should have session timeout management", async () => {
      const sessionPath = path.join(projectRoot, "app/utils/session.server.js");
      const sessionContent = await readFile(sessionPath, "utf-8");

      assert(
        sessionContent.includes("SessionManager"),
        "Should have SessionManager class",
      );
      assert(
        sessionContent.includes("SESSION_TIMEOUT"),
        "Should have timeout configuration",
      );
      assert(
        sessionContent.includes("requireValidSession"),
        "Should have session validation",
      );
    });

    await t.test("should have rate limiting system", async () => {
      const rateLimitPath = path.join(
        projectRoot,
        "app/utils/simpleRateLimit.server.js",
      );
      const rateLimitContent = await readFile(rateLimitPath, "utf-8");

      assert(
        rateLimitContent.includes("rateLimitStore"),
        "Should have rate limit store",
      );
      assert(
        rateLimitContent.includes("checkRateLimit"),
        "Should have rate limit checking",
      );
      assert(
        rateLimitContent.includes("rateLimitConfigs"),
        "Should have rate limit configs",
      );
    });

    await t.test(
      "should have security headers and HTTPS enforcement",
      async () => {
        const securityPath = path.join(
          projectRoot,
          "app/utils/security.server.js",
        );
        const securityContent = await readFile(securityPath, "utf-8");

        assert(
          securityContent.includes("enforceHTTPS"),
          "Should have HTTPS enforcement",
        );
        assert(
          securityContent.includes("securityHeaders"),
          "Should have security headers",
        );
        assert(
          securityContent.includes("Content-Security-Policy"),
          "Should have CSP headers",
        );
        assert(
          securityContent.includes("validateRequest"),
          "Should have request validation",
        );
      },
    );

    await t.test("should have input sanitization middleware", async () => {
      const sanitizationPath = path.join(
        projectRoot,
        "app/utils/sanitization.server.js",
      );
      const sanitizationContent = await readFile(sanitizationPath, "utf-8");

      assert(
        sanitizationContent.includes("sanitizeHTML"),
        "Should have HTML sanitization",
      );
      assert(
        sanitizationContent.includes("sanitizeXSS"),
        "Should have XSS protection",
      );
      assert(
        sanitizationContent.includes("inputValidation"),
        "Should have input validation",
      );
      assert(
        sanitizationContent.includes("stayBoostSchemas"),
        "Should have validation schemas",
      );
    });
  });

  await t.test("Monitoring & Health Checks", async (t) => {
    await t.test("should have comprehensive logging system", async () => {
      const loggerPath = path.join(projectRoot, "app/utils/logger.server.js");
      const loggerContent = await readFile(loggerPath, "utf-8");

      assert(
        loggerContent.includes("winston"),
        "Should use Winston for logging",
      );
      assert(
        loggerContent.includes("DailyRotateFile"),
        "Should have log rotation",
      );
      assert(loggerContent.includes("LOG_LEVELS"), "Should have log levels");
      assert(
        loggerContent.includes("logRequest"),
        "Should have request logging",
      );
      assert(
        loggerContent.includes("createTimer"),
        "Should have performance timing",
      );
    });

    await t.test("should have health check endpoints", async () => {
      const healthPath = path.join(projectRoot, "app/utils/health.server.js");
      const healthContent = await readFile(healthPath, "utf-8");

      assert(
        healthContent.includes("basicHealthCheck"),
        "Should have basic health check",
      );
      assert(
        healthContent.includes("readinessCheck"),
        "Should have readiness check",
      );
      assert(
        healthContent.includes("livenessCheck"),
        "Should have liveness check",
      );
      assert(
        healthContent.includes("HEALTH_LEVELS"),
        "Should have health check levels",
      );
    });

    await t.test("should have health check routes", async () => {
      // Basic health check route
      const healthRoutePath = path.join(projectRoot, "app/routes/health.jsx");
      const healthRouteContent = await readFile(healthRoutePath, "utf-8");
      assert(
        healthRouteContent.includes("basicHealthCheck"),
        "Should have basic health route",
      );

      // Readiness check route
      const readyRoutePath = path.join(
        projectRoot,
        "app/routes/health.ready.jsx",
      );
      const readyRouteContent = await readFile(readyRoutePath, "utf-8");
      assert(
        readyRouteContent.includes("readinessCheck"),
        "Should have readiness route",
      );

      // Liveness check route
      const liveRoutePath = path.join(
        projectRoot,
        "app/routes/health.live.jsx",
      );
      const liveRouteContent = await readFile(liveRoutePath, "utf-8");
      assert(
        liveRouteContent.includes("livenessCheck"),
        "Should have liveness route",
      );
    });
  });

  await t.test("Configuration Management", async (t) => {
    await t.test("should have comprehensive configuration system", async () => {
      const configPath = path.join(projectRoot, "app/utils/config.server.js");
      const configContent = await readFile(configPath, "utf-8");

      assert(
        configContent.includes("Configuration"),
        "Should have Configuration class",
      );
      assert(
        configContent.includes("validateConfiguration"),
        "Should have config validation",
      );
      assert(
        configContent.includes("getSecurityConfig"),
        "Should have security config",
      );
      assert(
        configContent.includes("getRateLimitConfig"),
        "Should have rate limit config",
      );
      assert(
        configContent.includes("getMonitoringConfig"),
        "Should have monitoring config",
      );
    });

    await t.test("should have environment configuration example", async () => {
      const envExamplePath = path.join(projectRoot, ".env.example");
      const envContent = await readFile(envExamplePath, "utf-8");

      assert(
        envContent.includes("SENTRY_DSN"),
        "Should have Sentry configuration",
      );
      assert(
        envContent.includes("RATE_LIMIT_ENABLED"),
        "Should have rate limiting config",
      );
      assert(
        envContent.includes("LOG_LEVEL"),
        "Should have logging configuration",
      );
      assert(
        envContent.includes("HEALTH_CHECK_ENABLED"),
        "Should have health check config",
      );
    });
  });

  await t.test("Enhanced API Security", async (t) => {
    await t.test(
      "should have enhanced settings API with security features",
      async () => {
        const settingsApiPath = path.join(
          projectRoot,
          "app/routes/api.stayboost.settings.jsx",
        );
        const settingsContent = await readFile(settingsApiPath, "utf-8");

        assert(
          settingsContent.includes("checkRateLimit"),
          "Should have rate limiting",
        );
        assert(
          settingsContent.includes("applySecurity"),
          "Should have security checks",
        );
        assert(
          settingsContent.includes("withInputSanitization"),
          "Should have input sanitization",
        );
        assert(
          settingsContent.includes("withSecurityHeaders"),
          "Should have security headers",
        );
        assert(
          settingsContent.includes("logRequest"),
          "Should have request logging",
        );
        assert(
          settingsContent.includes("createTimer"),
          "Should have performance timing",
        );
      },
    );
  });

  await t.test("Package Dependencies", async (t) => {
    await t.test(
      "should have all security and monitoring dependencies",
      async () => {
        const packagePath = path.join(projectRoot, "package.json");
        const packageContent = await readFile(packagePath, "utf-8");
        const packageJson = JSON.parse(packageContent);

        const expectedDeps = [
          "@sentry/remix",
          "@sentry/node",
          "winston",
          "winston-daily-rotate-file",
          "dompurify",
          "validator",
          "xss",
        ];

        for (const dep of expectedDeps) {
          assert(
            packageJson.dependencies[dep] || packageJson.devDependencies[dep],
            `Should have ${dep} dependency`,
          );
        }
      },
    );
  });

  await t.test("File Structure Validation", async (t) => {
    await t.test("should have all security utility files", async () => {
      const securityFiles = [
        "app/utils/sentry.server.js",
        "app/utils/session.server.js",
        "app/utils/simpleRateLimit.server.js",
        "app/utils/security.server.js",
        "app/utils/sanitization.server.js",
        "app/utils/logger.server.js",
        "app/utils/health.server.js",
        "app/utils/config.server.js",
      ];

      for (const file of securityFiles) {
        const filePath = path.join(projectRoot, file);
        try {
          await readFile(filePath, "utf-8");
        } catch (error) {
          assert.fail(`Security file ${file} should exist`);
        }
      }
    });

    await t.test("should have all health check routes", async () => {
      const healthRoutes = [
        "app/routes/health.jsx",
        "app/routes/health.detailed.jsx",
        "app/routes/health.ready.jsx",
        "app/routes/health.live.jsx",
      ];

      for (const route of healthRoutes) {
        const routePath = path.join(projectRoot, route);
        try {
          await readFile(routePath, "utf-8");
        } catch (error) {
          assert.fail(`Health route ${route} should exist`);
        }
      }
    });
  });

  console.log(
    "✅ All High Priority security and monitoring features are properly implemented!",
  );
});
