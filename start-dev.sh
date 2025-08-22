#!/bin/bash

# Pokemon Flappy Bird Development Server
# This script starts a local HTTP server to run the game

echo "Starting Pokemon Flappy Bird development server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi
