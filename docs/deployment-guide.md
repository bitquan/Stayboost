# Deployment Guide

## 🚀 Deployment Overview

This guide covers the complete deployment process for StayBoost, from development to production. Our deployment strategy includes staging environments, automated CI/CD pipelines, and blue-green deployments for zero-downtime updates.

## 🏗 Deployment Architecture (Priority #25)

### Staging Environment Management

**Location**: `app/utils/stagingEnvironment.server.js`

**Features**:
- Automated deployment pipeline
- Environment isolation and configuration
- Blue-green deployment strategy
- Rollback capabilities
- Infrastructure as code

### Environment Types

```javascript
const ENVIRONMENT_TYPES = {
  DEVELOPMENT: 'development',    // Local development
  STAGING: 'staging',           // Pre-production testing
  PRODUCTION: 'production',     // Live environment
  TESTING: 'testing',           // Automated testing
  PREVIEW: 'preview'            // Feature previews
};
```

## 🔧 Environment Setup

### 1. Development Environment

**Prerequisites**:
- Node.js 18+
- npm or yarn
- PostgreSQL (optional, uses SQLite by default)
- Redis (optional, for advanced features)

**Setup Steps**:
```bash
# Clone repository
git clone https://github.com/your-org/stayboost.git
cd stayboost

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

**Environment Variables** (`.env`):
```env
# App Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./dev.db"

# Shopify Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_orders
SHOPIFY_APP_URL=https://your-app.ngrok.io

# Optional Services
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_session_secret
```

### 2. Staging Environment

**Infrastructure**:
- Docker containers
- PostgreSQL database
- Redis cache
- Load balancer
- SSL certificates

**Docker Compose Configuration**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://user:pass@db:5432/stayboost_staging
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=stayboost_staging
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 3. Production Environment

**Infrastructure Requirements**:
- Kubernetes cluster or cloud service
- Managed database (PostgreSQL)
- Redis cluster
- CDN for static assets
- Monitoring and logging

**Kubernetes Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stayboost-production
  namespace: stayboost
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: stayboost
      env: production
  template:
    metadata:
      labels:
        app: stayboost
        env: production
    spec:
      containers:
      - name: stayboost
        image: stayboost:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: stayboost-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: stayboost-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy StayBoost
on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.image.outputs.image }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha

    - name: Build and push Docker image
      uses: docker/build-push-action@v3
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Output image
      id: image
      run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Deploy to staging
      run: |
        envsubst < k8s/staging/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/stayboost-staging
      env:
        IMAGE: ${{ needs.build.outputs.image }}

    - name: Run smoke tests
      run: |
        npm ci
        npm run test:smoke
      env:
        BASE_URL: https://staging.stayboost.com

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test, build]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'

    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG_PRODUCTION }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Deploy to production
      run: |
        envsubst < k8s/production/deployment.yaml | kubectl apply -f -
        kubectl rollout status deployment/stayboost-production
      env:
        IMAGE: ${{ needs.build.outputs.image }}

    - name: Run post-deployment tests
      run: |
        npm ci
        npm run test:e2e
      env:
        BASE_URL: https://app.stayboost.com

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🐳 Docker Configuration

### Dockerfile

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 remix

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules

# Copy startup script
COPY --from=builder /app/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

USER remix

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run database migrations and start the application
CMD ["./start.sh"]
```

### Startup Script

```bash
#!/bin/sh
# scripts/start.sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (if needed)
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting StayBoost application..."
exec npm start
```

## 🌐 Infrastructure as Code

### Terraform Configuration

```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# VPC and networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "stayboost-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "StayBoost"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "stayboost-${var.environment}"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 3
      
      instance_types = ["t3.medium"]
      
      k8s_labels = {
        Environment = var.environment
        Application = "stayboost"
      }
    }
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "stayboost-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "stayboost"
  username = "stayboost"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Environment = var.environment
    Project     = "StayBoost"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "stayboost-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "stayboost-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  tags = {
    Environment = var.environment
    Project     = "StayBoost"
  }
}
```

## 🔍 Health Checks and Monitoring

### Health Check Endpoint

```javascript
// app/routes/health.jsx
export async function loader() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }

  try {
    // Redis check (if configured)
    if (process.env.REDIS_URL) {
      await redis.ping();
      health.checks.redis = { status: 'healthy' };
    }
  } catch (error) {
    health.checks.redis = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  const status = health.status === 'healthy' ? 200 : 503;
  return json(health, { status });
}
```

### Monitoring Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'stayboost'
    static_configs:
      - targets: ['stayboost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

## 🔒 Security Configuration

### SSL/TLS Setup

```nginx
# nginx/ssl.conf
server {
    listen 443 ssl http2;
    server_name stayboost.com www.stayboost.com;
    
    ssl_certificate /etc/ssl/certs/stayboost.crt;
    ssl_certificate_key /etc/ssl/private/stayboost.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    location / {
        proxy_pass http://stayboost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Secrets Management

```yaml
# kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: stayboost-secrets
  namespace: stayboost
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  shopify-api-key: <base64-encoded-api-key>
  shopify-api-secret: <base64-encoded-api-secret>
  session-secret: <base64-encoded-session-secret>
```

## 🔄 Deployment Strategies

### Blue-Green Deployment

```javascript
// Deployment strategy implementation
export class BlueGreenDeployment {
  async deploy(newVersion) {
    // 1. Create green environment
    const greenEnv = await this.createGreenEnvironment(newVersion);
    
    // 2. Deploy to green
    await this.deployToEnvironment(greenEnv, newVersion);
    
    // 3. Run health checks
    const healthCheck = await this.runHealthChecks(greenEnv);
    if (!healthCheck.passed) {
      throw new Error('Health checks failed for green environment');
    }
    
    // 4. Switch traffic
    await this.switchTraffic(greenEnv);
    
    // 5. Monitor for issues
    await this.monitorDeployment(greenEnv, { duration: 300000 }); // 5 minutes
    
    // 6. Cleanup old environment
    await this.cleanupBlueEnvironment();
    
    return { success: true, environment: greenEnv };
  }
}
```

### Rolling Deployment

```yaml
# kubernetes/rolling-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stayboost-rolling
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  template:
    spec:
      containers:
      - name: stayboost
        image: stayboost:latest
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 📊 Deployment Metrics

### Key Deployment Metrics

| Metric | Target | Description |
|--------|---------|-------------|
| Deployment Time | <5 minutes | Total time for production deployment |
| Rollback Time | <2 minutes | Time to rollback failed deployment |
| Success Rate | >99% | Percentage of successful deployments |
| Zero Downtime | 100% | Deployments without service interruption |

### Monitoring Dashboard

```javascript
// Deployment monitoring
const deploymentMetrics = {
  deploymentFrequency: 'daily',
  leadTimeForChanges: '2-4 hours',
  meanTimeToRecovery: '<30 minutes',
  changeFailureRate: '<1%'
};
```

## 🚨 Rollback Procedures

### Automatic Rollback

```javascript
// Automatic rollback triggers
const rollbackTriggers = {
  healthCheckFailure: true,
  errorRateThreshold: 5, // 5%
  responseTimeThreshold: 2000, // 2 seconds
  customMetricThreshold: {
    metric: 'conversion_rate',
    threshold: 0.1 // 10% drop
  }
};
```

### Manual Rollback

```bash
# Manual rollback commands
kubectl rollout undo deployment/stayboost-production
kubectl rollout status deployment/stayboost-production

# Or specific revision
kubectl rollout undo deployment/stayboost-production --to-revision=2
```

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: ${new Date().toISOString()}  
**Supported Platforms**: AWS, GCP, Azure, Kubernetes  
**Status**: ✅ Production-Ready Deployment Pipeline
