#!/bin/bash

# Railway Deployment Setup Script for KoreShield
# This script helps prepare your KoreShield project for Railway deployment

echo " KoreShield Railway Deployment Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    echo " Error: railway.json not found. Please run this script from the llm-firewall directory."
    exit 1
fi

echo " Found railway.json configuration"

# Check for required files
REQUIRED_FILES=("docker/Dockerfile" "config/railway-config.yaml" "requirements.txt" "src/koreshield/proxy.py")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo " Error: Required file $file not found."
        exit 1
    fi
done

echo " All required files present"

# Check if Railway CLI is installed (optional)
if command -v railway &> /dev/null; then
    echo " Railway CLI is installed"
else
    echo "ℹ  Railway CLI not found. Install it with: npm install -g @railway/cli"
fi

echo ""
echo "📋 Next Steps for Railway Deployment:"
echo "====================================="
echo ""
echo "1. Push these changes to your GitHub repository:"
echo "   git add ."
echo "   git commit -m 'feat: add Railway deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Go to https://railway.app/dashboard"
echo ""
echo "3. Create a new project:"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Connect your GitHub account"
echo "   - Select your KoreShield repository"
echo "   - Set root directory to: llm-firewall"
echo ""
echo "4. Add Environment Variables in Railway:"
echo "   - DEEPSEEK_API_KEY = your_deepseek_api_key"
echo "   - PORT = 8000"
echo "   - JWT_PUBLIC_KEY = your_jwt_public_key (optional - for authentication)"
echo "   - REDIS_URL = (automatically provided when Redis plugin is added)"
echo ""
echo "5. Optional: Add Redis Database for better performance:"
echo "   - In your Railway project, click 'Add Plugin'"
echo "   - Search for 'Redis' and add it"
echo "   - Then update config/railway-config.yaml to enable Redis"
echo ""
echo "6. Deploy:"
echo "   - Railway will automatically build and deploy"
echo "   - Monitor progress in Railway dashboard"
echo ""
echo "7. Verify Deployment:"
echo "   curl https://your-project-url.up.railway.app/health"
echo ""
echo " Deployment complete! Your KoreShield instance will be available at the Railway URL."
echo ""
echo "📖 For detailed instructions, see: docs/RAILWAY_DEPLOYMENT.md"