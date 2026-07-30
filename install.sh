#!/bin/bash

# Wakem-t Local Installation Script (macOS/Linux)
set -e

APP_NAME="wakem-t"
INSTALL_DIR="$HOME/.local/bin"
PROJECT_ROOT=$(pwd)

echo "Installing $APP_NAME..."

# 1. Determine Binary Path
OS_TYPE=$(uname -s)
ARCH_TYPE=$(uname -m)

if [ "$OS_TYPE" == "Linux" ]; then
    BINARY_SOURCE="$PROJECT_ROOT/bin/wakem-t-linux"
elif [ "$OS_TYPE" == "Darwin" ]; then
    BINARY_SOURCE="$PROJECT_ROOT/bin/wakem-t-macos"
else
    echo "Unsupported OS: $OS_TYPE"
    exit 1
fi

# 2. Check if built
if [ ! -f "$BINARY_SOURCE" ]; then
    echo "Error: Binary not found at $BINARY_SOURCE"
    echo "Please run: npm run build && npx pkg . --targets node18-linux,node18-macos --out-path bin first."
    exit 1
fi

# 3. Prepare Install Directory
mkdir -p "$INSTALL_DIR"

# 4. Copy and Rename
cp "$BINARY_SOURCE" "$INSTALL_DIR/$APP_NAME"
chmod +x "$INSTALL_DIR/$APP_NAME"

echo "Success! $APP_NAME has been installed to $INSTALL_DIR/$APP_NAME"

# 5. PATH Verification
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo ""
    echo "WARNING: $INSTALL_DIR is not in your PATH."
    echo "Please add the following line to your .bashrc or .zshrc:"
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
fi

echo "You can now run '$APP_NAME --version' from anywhere."
