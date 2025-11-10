#!/bin/bash

# Script to fix port 3001 already in use error in Codespaces

echo "🔍 Checking what's using port 3001..."

# Find process using port 3001
PID=$(lsof -ti:3001 2>/dev/null || fuser 3001/tcp 2>/dev/null | awk '{print $1}')

if [ -z "$PID" ]; then
  echo "⚠️  No process found using port 3001"
  echo "   The port might be reserved or the process already stopped."
  echo ""
  echo "💡 Try starting the server again:"
  echo "   cd server && npm run dev"
  exit 0
fi

echo "📋 Found process using port 3001:"
ps -p $PID -o pid,cmd 2>/dev/null || echo "   PID: $PID"

echo ""
echo "🛑 Stopping process on port 3001..."

# Try graceful kill first
kill $PID 2>/dev/null

# Wait a moment
sleep 2

# Check if still running
if kill -0 $PID 2>/dev/null; then
  echo "⚠️  Process still running, forcing stop..."
  kill -9 $PID 2>/dev/null
  sleep 1
fi

# Verify port is free
if lsof -ti:3001 >/dev/null 2>&1 || fuser 3001/tcp >/dev/null 2>&1; then
  echo "❌ Port 3001 is still in use. Try manually:"
  echo "   lsof -ti:3001 | xargs kill -9"
  echo "   or"
  echo "   fuser -k 3001/tcp"
else
  echo "✅ Port 3001 is now free!"
  echo ""
  echo "🚀 You can now start the backend server:"
  echo "   cd server && npm run dev"
fi

