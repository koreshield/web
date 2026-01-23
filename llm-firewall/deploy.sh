#!/bin/bash

# KoreShield Deployment Script
# This script helps deploy KoreShield to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}KoreShield Deployment Script${NC}"

# Check if required tools are installed
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi

    if ! command -v kubectl &> /dev/null; then
        echo -e "${YELLOW}kubectl not found. Kubernetes deployment will not be available.${NC}"
    fi

    echo -e "${GREEN}Dependencies OK${NC}"
}

# Setup environment variables
setup_env() {
    echo -e "${YELLOW}Setting up environment...${NC}"

    if [ -z "$DEEPSEEK_API_KEY" ]; then
        echo -e "${RED}DEEPSEEK_API_KEY environment variable is not set${NC}"
        echo "Please set it with: export DEEPSEEK_API_KEY=your_key_here"
        exit 1
    fi

    # Create .env file for docker-compose
    cat > .env << EOF
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
EOF

    echo -e "${GREEN}Environment setup complete${NC}"
}

# Deploy locally with docker-compose
deploy_local() {
    echo -e "${YELLOW}Deploying locally with Docker Compose...${NC}"

    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d

    echo -e "${GREEN}Local deployment complete${NC}"
    echo -e "${YELLOW}KoreShield is running at: http://localhost:8000${NC}"
    echo -e "${YELLOW}Health check: http://localhost:8000/health${NC}"
    echo -e "${YELLOW}API docs: http://localhost:8000/docs${NC}"
}

# Deploy to production (Kubernetes)
deploy_k8s() {
    echo -e "${YELLOW}Deploying to Kubernetes...${NC}"

    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}kubectl is required for Kubernetes deployment${NC}"
        exit 1
    fi

    # Update the deployment with your registry
    echo -e "${YELLOW}Please update k8s/deployment.yaml with your container registry${NC}"
    echo -e "${YELLOW}Then run: kubectl apply -f k8s/${NC}"

    # Build and push image (example)
    echo -e "${YELLOW}To build and push the image:${NC}"
    echo "docker build -t your-registry/koreshield:latest ."
    echo "docker push your-registry/koreshield:latest"
}

# Show usage
usage() {
    echo "Usage: $0 [local|k8s|check]"
    echo ""
    echo "Commands:"
    echo "  local    Deploy locally using Docker Compose"
    echo "  k8s      Show instructions for Kubernetes deployment"
    echo "  check    Check deployment prerequisites"
    echo ""
    echo "Environment Variables:"
    echo "  DEEPSEEK_API_KEY    Required: Your DeepSeek API key"
    echo ""
    echo "Examples:"
    echo "  export DEEPSEEK_API_KEY=your_key"
    echo "  ./deploy.sh local"
}

# Main script
case "${1:-help}" in
    "local")
        check_dependencies
        setup_env
        deploy_local
        ;;
    "k8s")
        deploy_k8s
        ;;
    "check")
        check_dependencies
        ;;
    *)
        usage
        ;;
esac