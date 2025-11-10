#!/bin/bash

# Start script for Codespaces
# This runs both frontend and backend in separate terminals

echo "🚀 Starting Another RA application..."

# Check if .env files exist
if [ ! -f server/.env ]; then
  echo "❌ Error: server/.env file not found!"
  echo "Please create server/.env with your Airtable credentials."
  exit 1
fi

# Start backend server in background
echo "🔧 Starting backend server (port 3001)..."
cd server
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server (port 3000)..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Servers starting..."
echo "📊 Backend API: http://localhost:3001"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"

# Keep script running
wait

