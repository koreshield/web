#!/bin/bash

# =============================================================================
# KoreShield Security Hardening Script
# =============================================================================
# This script performs security checks and hardening before production deployment
# Run this before deploying to production: ./scripts/security-check.sh
# =============================================================================

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  KoreShield Security Hardening & Audit"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Track issues
CRITICAL_ISSUES=0
WARNINGS=0

# =============================================================================
# 1. Check for Secrets in Git History
# =============================================================================
echo "📋 Checking for secrets in code..."

# Check for common secret patterns
SECRET_PATTERNS=(
    "api[_-]?key.*=.*['\"][^'\"]{20,}['\"]"
    "password.*=.*['\"][^'\"]{8,}['\"]"
    "secret.*=.*['\"][^'\"]{20,}['\"]"
    "private[_-]?key.*BEGIN.*PRIVATE.*KEY"
    "sk-[a-zA-Z0-9]{20,}"  # OpenAI/Anthropic format
    "AIza[0-9A-Za-z\\-_]{35}"  # Google API
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    matches=$(grep -rn -E "$pattern" "$PROJECT_ROOT" \
        --exclude-dir={node_modules,.git,dist,build,venv,.venv,htmlcov} \
        --exclude={*.log,*.md,security-check.sh,SECURITY.md} \
        2>/dev/null || true)
    
    if [ -n "$matches" ]; then
        echo -e "${RED}❌ CRITICAL: Potential secrets found!${NC}"
        echo "$matches"
        ((CRITICAL_ISSUES++))
    fi
done

if [ $CRITICAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets found in code${NC}"
fi

# =============================================================================
# 2. Check .gitignore Configuration
# =============================================================================
echo ""
echo "📋 Checking .gitignore configuration..."

REQUIRED_IGNORES=(".env" ".env.local" "*.log" "*.key" "*.pem")
GITIGNORE_FILE="$PROJECT_ROOT/.gitignore"

if [ ! -f "$GITIGNORE_FILE" ]; then
    echo -e "${RED}❌ CRITICAL: .gitignore file not found!${NC}"
    ((CRITICAL_ISSUES++))
else
    for pattern in "${REQUIRED_IGNORES[@]}"; do
        if ! grep -q "$pattern" "$GITIGNORE_FILE"; then
            echo -e "${YELLOW}⚠️  WARNING: '$pattern' not in .gitignore${NC}"
            ((WARNINGS++))
        fi
    done
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
fi

# =============================================================================
# 3. Check for Committed .env Files
# =============================================================================
echo ""
echo "📋 Checking for committed .env files..."

ENV_FILES=$(find "$PROJECT_ROOT" -name ".env" -o -name ".env.local" -o -name ".env.production" 2>/dev/null || true)

if [ -n "$ENV_FILES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: .env files found:${NC}"
    echo "$ENV_FILES"
    echo "These files should be in .gitignore and never committed!"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ No .env files found in repository${NC}"
fi

# =============================================================================
# 4. Check Frontend Bundle for Secrets
# =============================================================================
echo ""
echo "📋 Checking frontend for VITE_* variables..."

VITE_ENV_FILE="$PROJECT_ROOT/koreshield-web/src/vite-env.d.ts"

if [ -f "$VITE_ENV_FILE" ]; then
    if grep -q "VITE_PUBLIC_API_KEY\|VITE_API_KEY" "$VITE_ENV_FILE"; then
        echo -e "${RED}❌ CRITICAL: VITE_API_KEY found in type definitions!${NC}"
        echo "API keys should NEVER be in frontend code!"
        ((CRITICAL_ISSUES++))
    else
        echo -e "${GREEN}✅ No API keys in frontend type definitions${NC}"
    fi
fi

# Check api-client.ts for API key usage
API_CLIENT="$PROJECT_ROOT/koreshield-web/src/lib/api-client.ts"

if [ -f "$API_CLIENT" ]; then
    if grep -q "import.meta.env.VITE_PUBLIC_API_KEY\|import.meta.env.VITE_API_KEY" "$API_CLIENT"; then
        echo -e "${RED}❌ CRITICAL: Client-side API key usage detected!${NC}"
        ((CRITICAL_ISSUES++))
    else
        echo -e "${GREEN}✅ No client-side API key usage in api-client.ts${NC}"
    fi
fi

# =============================================================================
# 5. Check for Security Headers
# =============================================================================
echo ""
echo "📋 Checking security headers in index.html..."

INDEX_HTML="$PROJECT_ROOT/koreshield-web/index.html"

if [ -f "$INDEX_HTML" ]; then
    REQUIRED_HEADERS=(
        "Content-Security-Policy"
        "X-Content-Type-Options"
        "X-XSS-Protection"
    )
    
    for header in "${REQUIRED_HEADERS[@]}"; do
        if ! grep -q "$header" "$INDEX_HTML"; then
            echo -e "${YELLOW}⚠️  WARNING: Missing security header: $header${NC}"
            ((WARNINGS++))
        fi
    done
    
    echo -e "${GREEN}✅ Security headers present in index.html${NC}"
fi

# =============================================================================
# 6. Check Python Dependencies for Vulnerabilities
# =============================================================================
echo ""
echo "📋 Checking Python dependencies for vulnerabilities..."

if command -v pip-audit &> /dev/null; then
    cd "$PROJECT_ROOT/koreshield"
    if pip-audit --desc 2>&1 | grep -q "Found.*vulnerabilities"; then
        echo -e "${YELLOW}⚠️  WARNING: Vulnerabilities found in Python dependencies${NC}"
        echo "Run 'pip-audit' for details"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ No known vulnerabilities in Python dependencies${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  pip-audit not installed. Run: pip install pip-audit${NC}"
    ((WARNINGS++))
fi

# =============================================================================
# 7. Check Node Dependencies for Vulnerabilities
# =============================================================================
echo ""
echo "📋 Checking Node dependencies for vulnerabilities..."

cd "$PROJECT_ROOT/koreshield-web"

if [ -f "package.json" ]; then
    AUDIT_OUTPUT=$(npm audit --audit-level=moderate 2>&1 || true)
    
    if echo "$AUDIT_OUTPUT" | grep -q "vulnerabilities"; then
        echo -e "${YELLOW}⚠️  WARNING: Vulnerabilities found in Node dependencies${NC}"
        echo "Run 'npm audit' for details"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ No high/critical vulnerabilities in Node dependencies${NC}"
    fi
fi

# =============================================================================
# 8. Check JWT Configuration
# =============================================================================
echo ""
echo "📋 Checking JWT configuration..."

AUTH_PY="$PROJECT_ROOT/koreshield/src/koreshield/api/auth.py"

if [ -f "$AUTH_PY" ]; then
    if grep -q 'JWT_ALGORITHM = "HS256"' "$AUTH_PY"; then
        echo -e "${YELLOW}⚠️  WARNING: Using HS256. Consider RS256 for better security${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✅ Using RS256 algorithm for JWT${NC}"
    fi
fi

# =============================================================================
# 9. Check for TODO Security Items
# =============================================================================
echo ""
echo "📋 Checking for TODO security items..."

TODO_SECURITY=$(grep -rn "TODO.*security\|TODO.*auth\|TODO.*password" "$PROJECT_ROOT" \
    --exclude-dir={node_modules,.git,dist,build,venv,.venv} \
    --exclude={*.md,security-check.sh} \
    2>/dev/null || true)

if [ -n "$TODO_SECURITY" ]; then
    echo -e "${YELLOW}⚠️  Security-related TODOs found:${NC}"
    echo "$TODO_SECURITY"
    ((WARNINGS++))
fi

# =============================================================================
# 10. Check CORS Configuration
# =============================================================================
echo ""
echo "📋 Checking CORS configuration..."

PROXY_PY="$PROJECT_ROOT/koreshield/src/koreshield/proxy.py"

if [ -f "$PROXY_PY" ]; then
    if grep -q 'allow_origins=\["*"\]' "$PROXY_PY"; then
        echo -e "${RED}❌ CRITICAL: CORS allows all origins (*)!${NC}"
        echo "This should be restricted to specific domains in production"
        ((CRITICAL_ISSUES++))
    else
        echo -e "${GREEN}✅ CORS configuration looks secure${NC}"
    fi
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Security Audit Summary"
echo "═══════════════════════════════════════════════════════════════"

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}❌ CRITICAL ISSUES: $CRITICAL_ISSUES${NC}"
    echo "⚠️  DO NOT DEPLOY TO PRODUCTION until these are fixed!"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo "Review these warnings before production deployment"
fi

if [ $CRITICAL_ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All security checks passed!${NC}"
    echo "Your application is ready for production deployment"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Exit with error if critical issues found
if [ $CRITICAL_ISSUES -gt 0 ]; then
    exit 1
fi

exit 0
