#!/bin/bash
# Install prerequisites for singapore-property-search skill

set -e

echo "Installing prerequisites for Singapore Property Search..."

# Check and install Bun
if command -v bun &> /dev/null; then
    echo "✓ Bun is already installed ($(bun --version))"
else
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    echo "✓ Bun installed"
fi

# Check and install agent-browser
if command -v agent-browser &> /dev/null; then
    echo "✓ agent-browser is already installed"
else
    echo "Installing agent-browser..."
    npm install -g agent-browser
    echo "✓ agent-browser installed"
fi

# Install Chromium for agent-browser
echo "Ensuring Chromium is installed for agent-browser..."
agent-browser install
echo "✓ Chromium ready"

echo ""
echo "All prerequisites installed!"
echo ""
echo "To run a property search:"
echo "  cd ~/.factory/skills/singapore-property-search/scripts && bun run search.ts"
