#!/bin/bash

# Script to update NEXT_PUBLIC_API_URL for Codespaces
# Run this if the API URL needs to be updated after Codespace creation

echo "🔧 Updating API URL configuration..."

if [ -n "$CODESPACE_NAME" ]; then
  # We're in Codespaces
  CODESPACE_BACKEND_URL="https://${CODESPACE_NAME}-3001.preview.app.github.dev"
  echo "✅ Detected Codespaces: $CODESPACE_NAME"
  echo "   Backend URL: $CODESPACE_BACKEND_URL"
  
  # Update or create .env.local
  if [ -f .env.local ]; then
    # Update existing file
    if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
      # Update existing line
      sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=${CODESPACE_BACKEND_URL}/api|" .env.local
      echo "✅ Updated existing .env.local"
    else
      # Append to file
      echo "" >> .env.local
      echo "# Codespaces Configuration" >> .env.local
      echo "NEXT_PUBLIC_API_URL=${CODESPACE_BACKEND_URL}/api" >> .env.local
      echo "✅ Added to existing .env.local"
    fi
  else
    # Create new file
    cat > .env.local << EOF
# Codespaces Configuration
NEXT_PUBLIC_API_URL=${CODESPACE_BACKEND_URL}/api
EOF
    echo "✅ Created new .env.local"
  fi
  
  echo ""
  echo "📋 Current configuration:"
  cat .env.local
  echo ""
  echo "⚠️  You may need to restart the frontend server for changes to take effect."
  echo "   Run: npm run dev"
else
  echo "⚠️  Not in Codespaces environment."
  echo "   This script is for Codespaces only."
  echo "   For local development, use: NEXT_PUBLIC_API_URL=http://localhost:3001/api"
fi

