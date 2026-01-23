# Railway Deployment Guide for KoreShield

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your KoreShield code should be in a GitHub repo
3. **API Keys**: LLM provider API keys (DeepSeek, OpenAI, etc.)

## Step 1: Prepare Your Repository

### 1.1 Create Railway Configuration Files

Create these files in your `llm-firewall` directory:

**railway.json** (for Railway-specific config):
```json
{
  "build": {
    "builder": "dockerfile",
    "dockerfilePath": "docker/Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn src.koreshield.proxy:app --host 0.0.0.0 --port $PORT"
  }
}
```

**config/railway-config.yaml** (Railway-specific config):
```yaml
server:
  host: "0.0.0.0"
  port: 8000

logging:
  level: INFO
  json_logs: true
  container_mode: true

security:
  sensitivity: medium
  default_action: block
  features:
    sanitization: true
    detection: true
    policy_enforcement: true

providers:
  deepseek:
    enabled: true
    base_url: "https://api.deepseek.com/v1"
  openai:
    enabled: false
    base_url: "https://api.openai.com/v1"
  anthropic:
    enabled: false
    base_url: "https://api.anthropic.com/v1"

redis:
  enabled: true
  url: "${REDIS_URL}"

monitoring:
  enabled: true
  check_interval_seconds: 60

alerting:
  enabled: true
  rules:
    - name: "High Attack Rate"
      condition: "attacks_detected > 10"
      severity: "warning"
      channels: ["webhook"]
      cooldown_minutes: 5
  webhook:
    enabled: true
    url: "${ALERT_WEBHOOK_URL}"
```

## Step 2: Set Up Railway Project

### 2.1 Create New Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your KoreShield repository
6. Choose the `llm-firewall` directory as the root

### 2.2 Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

**Required Variables:**
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=8000
```

**Optional Variables (add as needed):**
```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
REDIS_URL=rediss://your-redis-url  # Railway provides this automatically
ALERT_WEBHOOK_URL=https://your-alert-webhook.com
```

## Step 3: Set Up Redis Database

### 3.1 Add Redis Plugin
1. In your Railway project, click "Add Plugin"
2. Search for "Redis" and add it
3. Railway will automatically set the `REDIS_URL` environment variable

### 3.2 Verify Redis Connection
Railway automatically provides the Redis URL as an environment variable.

## Step 4: Configure Build Settings

### 4.1 Set Build Command
In Railway project settings:
- **Build Command**: Leave empty (uses Dockerfile)
- **Start Command**: `uvicorn src.koreshield.proxy:app --host 0.0.0.0 --port $PORT`

### 4.2 Environment
- **Environment**: Production
- **Region**: Choose closest to your users

## Step 5: Deploy

### 5.1 Initial Deployment
1. Push your changes to GitHub (including the `railway.json` and config files)
2. Railway will automatically detect changes and start deployment
3. Monitor the build logs in Railway dashboard

### 5.2 Verify Deployment
Once deployed, Railway will provide a public URL. Test with:

```bash
# Health check
curl https://your-railway-url.up.railway.app/health

# API documentation
curl https://your-railway-url.up.railway.app/docs
```

## Step 6: Configure Domain (Optional)

### 6.1 Custom Domain
1. Go to Railway project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 6.2 SSL Certificate
Railway automatically provides SSL certificates for all domains.

## Step 7: Monitoring & Scaling

### 7.1 Enable Metrics
Railway provides basic monitoring. For advanced monitoring:
- Access `/metrics` endpoint for Prometheus metrics
- Set up external monitoring (Grafana, DataDog, etc.)

### 7.2 Scaling
- Railway automatically scales based on traffic
- Monitor usage in Railway dashboard
- Upgrade plan if needed for higher limits

## Step 8: Security Configuration

### 8.1 Environment Variables Security
- All secrets are encrypted in Railway
- Never commit API keys to code
- Rotate keys regularly via Railway dashboard

### 8.2 Network Security
- Railway provides automatic HTTPS
- Configure CORS in your application if needed
- Use Railway's firewall features

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Railway build logs
   - Verify Dockerfile is correct
   - Ensure all dependencies are in requirements.txt

2. **Application Won't Start**
   - Check environment variables are set
   - Verify Redis connection
   - Check application logs in Railway dashboard

3. **API Key Issues**
   - Ensure API keys are set in Railway variables
   - Check key validity
   - Verify provider configurations

### Logs
Access logs in Railway dashboard:
- Go to your service → Logs tab
- Real-time log streaming available
- Search and filter logs

## Cost Optimization

### Railway Pricing
- **Hobby Plan**: Free tier with limits
- **Pro Plan**: $5/month for better performance
- **Team Plan**: For multiple users

### Resource Usage
- Monitor CPU/memory usage in Railway dashboard
- Optimize based on actual traffic patterns
- Use Railway's auto-scaling features

## Backup & Recovery

### Database Backups
- Railway automatically backs up Redis data
- No manual backup needed for Redis
- Monitor backup status in Railway dashboard

### Application Updates
- Push changes to GitHub main branch
- Railway auto-deploys on changes
- Rollback to previous deployments if needed

## Next Steps

After successful deployment:
1. Configure your web application to use KoreShield proxy
2. Set up monitoring and alerting
3. Configure security policies via the admin interface
4. Test with real traffic
5. Set up additional Railway services if needed

## Support

For Railway-specific issues:
- Check Railway documentation
- Use Railway community forums
- Contact Railway support

For KoreShield issues:
- Check application logs
- Review configuration
- Test locally first
- Check GitHub issues