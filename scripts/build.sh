#!/bin/bash
set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building frontend..."
cd "$PROJECT_ROOT/frontend"

# Install deps if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm ci
fi

# Build to fastly-compute/handlers/static
npm run build

echo "Frontend built to fastly-compute/handlers/static/"

# Build Go WASM binary
cd "$PROJECT_ROOT/fastly-compute"
echo "Building Go WASM..."

# Create bin directory if it doesn't exist
mkdir -p bin

# Build for WASI
GOOS=wasip1 GOARCH=wasm go build -o bin/main.wasm .

echo "Build complete! WASM binary at fastly-compute/bin/main.wasm"
