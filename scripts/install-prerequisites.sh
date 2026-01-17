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

# Check and install agent-browser skill
AGENT_BROWSER_PATH="$HOME/.factory/skills/agent-browser"
if [ -d "$AGENT_BROWSER_PATH" ]; then
    echo "✓ agent-browser skill is already installed"
else
    echo "Installing agent-browser skill..."
    npx add-skill agent-browser
    echo "✓ agent-browser skill installed"
fi

echo ""
echo "All prerequisites installed!"
echo ""
echo "To run a property search:"
echo "  cd ~/.factory/skills/singapore-property-search/scripts && bun run search.ts"
