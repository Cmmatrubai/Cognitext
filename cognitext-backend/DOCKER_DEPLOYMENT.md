# Docker Deployment Guide

This guide explains how to deploy the Cognitext backend using Docker.

## Prerequisites

1. **Docker**: Install Docker Desktop or Docker Engine
2. **Docker Compose**: Usually included with Docker Desktop
3. **Git**: To clone the repository
4. **Gemini API Key**: Required for AI text simplification

## Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd cognitext-backend
```

### 2. Set Environment Variables
Create a `.env` file in the backend directory:
```bash
# Create .env file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

### 3. Build and Run with Docker Compose
```bash
# Build and start the service
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Verify Deployment
```bash
# Check if the service is running
curl http://localhost:8080/actuator/health

# Test the API
curl -X POST http://localhost:8080/api/v1/simplify \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a test.","gradeLevel":4}'
```

## Deployment Options

### Option 1: Local Docker Deployment
For development or testing:

```bash
# Build the image
docker build -t cognitext-backend .

# Run the container
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_api_key \
  cognitext-backend
```

### Option 2: Docker Compose (Recommended)
For production-like environments:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Cloud Deployment

#### AWS ECS/Fargate
1. Create an ECR repository
2. Push the Docker image
3. Create an ECS service
4. Configure environment variables

#### Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/cognitext-backend

# Deploy to Cloud Run
gcloud run deploy cognitext-backend \
  --image gcr.io/PROJECT_ID/cognitext-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key
```

#### Azure Container Instances
```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name cognitext-backend \
  --image cognitext-backend:latest \
  --ports 8080 \
  --environment-variables GEMINI_API_KEY=your_api_key
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes | None |
| `SPRING_PROFILES_ACTIVE` | Spring profile | No | production |
| `SERVER_PORT` | Server port | No | 8080 |

## Docker Commands Reference

### Building
```bash
# Build the image
docker build -t cognitext-backend .

# Build with specific tag
docker build -t cognitext-backend:v1.0.0 .
```

### Running
```bash
# Run container
docker run -p 8080:8080 cognitext-backend

# Run with environment variables
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  cognitext-backend

# Run in detached mode
docker run -d -p 8080:8080 cognitext-backend
```

### Management
```bash
# List running containers
docker ps

# View container logs
docker logs <container_id>

# Stop container
docker stop <container_id>

# Remove container
docker rm <container_id>
```

## Production Considerations

### 1. Security
- Use secrets management for API keys
- Enable HTTPS in production
- Configure proper CORS settings
- Use non-root user in container

### 2. Monitoring
- Add health check endpoints
- Configure logging
- Set up monitoring (Prometheus, Grafana)
- Enable metrics collection

### 3. Scaling
- Use load balancers
- Configure auto-scaling
- Set resource limits
- Use container orchestration (Kubernetes)

### 4. Backup and Recovery
- Backup configuration
- Set up automated backups
- Test recovery procedures

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 8080
   netstat -tulpn | grep 8080
   
   # Use different port
   docker run -p 8081:8080 cognitext-backend
   ```

2. **API key not set**
   ```bash
   # Check environment variables
   docker exec <container_id> env | grep GEMINI
   ```

3. **Container won't start**
   ```bash
   # Check logs
   docker logs <container_id>
   
   # Check resource usage
   docker stats
   ```

4. **Network connectivity**
   ```bash
   # Test connectivity
   curl http://localhost:8080/actuator/health
   
   # Check container network
   docker network ls
   ```

### Debugging Commands
```bash
# Enter running container
docker exec -it <container_id> /bin/bash

# View container details
docker inspect <container_id>

# Check container resources
docker stats <container_id>
```

## Integration with Frontend

Once the backend is deployed, update the frontend to point to the new URL:

### Local Docker
```javascript
// In main.js, update the URL
const response = await axios.post(
  "http://localhost:8080/api/v1/simplify",
  // ... rest of the code
);
```

### Cloud Deployment
```javascript
// Update to cloud URL
const response = await axios.post(
  "https://your-backend-url.com/api/v1/simplify",
  // ... rest of the code
);
```

## Next Steps

1. **Set up CI/CD**: Automate building and deployment
2. **Add monitoring**: Set up logging and metrics
3. **Configure SSL**: Enable HTTPS for production
4. **Set up backups**: Configure automated backups
5. **Load testing**: Test performance under load 