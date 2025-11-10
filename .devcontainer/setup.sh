#!/bin/bash

echo "🚀 Setting up Another RA development environment..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Create .env files if they don't exist
echo "📝 Setting up environment files..."

# Frontend .env.local (if needed)
if [ ! -f .env.local ]; then
  echo "Creating .env.local template..."
  
  # Detect if we're in Codespaces
  if [ -n "$CODESPACE_NAME" ]; then
    # We're in Codespaces - use the Codespaces backend URL
    # The backend will be on port 3001, accessible via preview URL
    # Format: https://CODESPACE_NAME-3001.preview.app.github.dev
    CODESPACE_BACKEND_URL="https://${CODESPACE_NAME}-3001.preview.app.github.dev"
    echo "🔍 Detected Codespaces environment: $CODESPACE_NAME"
    echo "   Backend URL: $CODESPACE_BACKEND_URL"
    cat > .env.local << EOF
# Codespaces Configuration
NEXT_PUBLIC_API_URL=${CODESPACE_BACKEND_URL}/api
EOF
  else
    # Local development
    cat > .env.local << EOF
# Local Development Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
  fi
fi

# Backend .env
if [ ! -f server/.env ]; then
  echo "Creating server/.env template..."
  cat > server/.env << EOF
PORT=3001
NODE_ENV=development
DATABASE_TYPE=airtable
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token_here
AIRTABLE_SYSTEM_CONFIG_BASE_ID=your_base_id_here
AIRTABLE_COMPANY_TABLE_ID=your_table_id_here
AIRTABLE_COMPANY_TABLE_NAME=Companies
EOF
  echo "⚠️  Please update server/.env with your Airtable credentials!"
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your Airtable credentials"
echo "2. Run 'npm run dev' in the root directory (for frontend)"
echo "3. Run 'cd server && npm run dev' (for backend)"
echo "4. Or use the provided start script: bash .devcontainer/start.sh"

