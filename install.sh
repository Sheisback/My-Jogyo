#!/bin/bash
#
# 🎓 Gyoshu & Jogyo Installer
# One-click installation for the research automation duo
#
set -e

# Colors for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}┌─────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC}  🎓 ${GREEN}Gyoshu & Jogyo${NC} — Research Automation Installer  ${BLUE}│${NC}"
echo -e "${BLUE}│${NC}     ${YELLOW}교수 (Professor) + 조교 (Teaching Assistant)${NC}     ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────┘${NC}"
echo ""

# Handle --check mode (smoke tests without installation)
if [ "$1" = "--check" ]; then
    echo -e "🩺 ${BLUE}Running system checks...${NC}"
    echo ""
    
    CHECKS_PASSED=0
    CHECKS_FAILED=0
    
    # Check 1: OpenCode
    echo -n "   OpenCode installation... "
    if command -v opencode &> /dev/null; then
        echo -e "${GREEN}✅ Pass${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ Fail${NC} (not found in PATH)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    
    # Check 2: Python version (3.10+)
    echo -n "   Python 3.10+... "
    if command -v python3 &> /dev/null; then
        PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        PY_MAJOR=$(echo "$PY_VERSION" | cut -d. -f1)
        PY_MINOR=$(echo "$PY_VERSION" | cut -d. -f2)
        if [ "$PY_MAJOR" -gt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -ge 10 ]); then
            echo -e "${GREEN}✅ Pass${NC} (Python $PY_VERSION)"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌ Fail${NC} (Python $PY_VERSION, need 3.10+)"
            CHECKS_FAILED=$((CHECKS_FAILED + 1))
        fi
    else
        echo -e "${RED}❌ Fail${NC} (python3 not found)"
        CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
    
    # Check 3: Core packages (pandas, numpy)
    echo -n "   Core packages (pandas, numpy)... "
    if python3 -c "import pandas; import numpy" 2>/dev/null; then
        echo -e "${GREEN}✅ Pass${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️ Warning${NC} (not installed - optional)"
    fi
    
    # Check 4: Extension installed
    echo -n "   Gyoshu extension... "
    if [ -d "$HOME/.config/opencode/command" ] && [ -f "$HOME/.config/opencode/command/gyoshu.md" ]; then
        echo -e "${GREEN}✅ Pass${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️ Not installed${NC} (run ./install.sh first)"
    fi
    
    echo ""
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$CHECKS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}All checks passed!${NC} Ready for research."
        echo ""
        echo -e "Next: ${BLUE}opencode${NC} then ${BLUE}/gyoshu${NC}"
        exit 0
    else
        echo -e "${RED}$CHECKS_FAILED check(s) failed.${NC}"
        echo ""
        echo "Fix the issues above and run again."
        exit 1
    fi
fi

# Check if we're in a cloned repo or running via curl
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_URL="https://github.com/Yeachan-Heo/My-Jogyo.git"
TEMP_DIR=""

if [ -d "$SCRIPT_DIR/src" ]; then
    # Running from cloned repo
    SOURCE_DIR="$SCRIPT_DIR"
    echo -e "📂 Installing from local directory..."
else
    # Running via curl, need to clone - check git exists first
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found. Install git or clone the repo manually:${NC}"
        echo -e "   ${BLUE}git clone https://github.com/Yeachan-Heo/My-Jogyo.git${NC}"
        exit 1
    fi
    echo -e "📥 Downloading Gyoshu & Jogyo..."
    TEMP_DIR=$(mktemp -d)
    # Ensure temp dir cleanup on any exit
    cleanup() { [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"; }
    trap cleanup EXIT
    git clone --depth 1 "$REPO_URL" "$TEMP_DIR"
    SOURCE_DIR="$TEMP_DIR"
fi

# 1. Check Python FIRST (require 3.10+) - before any file operations
echo -e "🐍 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    PY_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
    PY_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
    if [ "$PY_MAJOR" -gt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -ge 10 ]); then
        echo -e "   Found Python ${GREEN}$PYTHON_VERSION${NC} ✓"
    else
        echo -e "${RED}❌ Python $PYTHON_VERSION found, but 3.10+ required${NC}"
        echo -e "   Ubuntu: ${BLUE}sudo apt install python3.10${NC}"
        echo -e "   macOS:  ${BLUE}brew install python@3.10${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.10+${NC}"
    exit 1
fi

# 2. Create config directory
CONFIG_DIR="$HOME/.config/opencode"
echo -e "📁 Creating config directory: ${YELLOW}$CONFIG_DIR${NC}"
mkdir -p "$CONFIG_DIR"

# 3. Clean up deprecated commands from previous installs
DEPRECATED_COMMANDS="gyoshu-abort gyoshu-continue gyoshu-interactive gyoshu-list gyoshu-migrate gyoshu-plan gyoshu-replay gyoshu-repl gyoshu-report gyoshu-run gyoshu-search gyoshu-unlock"
for cmd in $DEPRECATED_COMMANDS; do
    if [ -f "$CONFIG_DIR/command/${cmd}.md" ]; then
        rm -f "$CONFIG_DIR/command/${cmd}.md"
    fi
done

# 4. Copy extension files
echo -e "📋 Copying extension files..."
if command -v rsync &> /dev/null; then
    rsync -a \
        --exclude='*.test.ts' \
        --exclude='*.test.js' \
        --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='.git' \
        "$SOURCE_DIR/src/" "$CONFIG_DIR/"
else
    cp -r "$SOURCE_DIR/src/"* "$CONFIG_DIR/"
    find "$CONFIG_DIR" -name "*.test.ts" -delete 2>/dev/null || true
    find "$CONFIG_DIR" -name "*.test.js" -delete 2>/dev/null || true
fi

# 5. Clean up temp directory if used
if [ -n "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR"
fi

# 6. Check OpenCode
echo -e "🔍 Checking OpenCode installation..."
if command -v opencode &> /dev/null; then
    echo -e "   ${GREEN}✓${NC} OpenCode found"
else
    echo -e "   ${YELLOW}⚠${NC} OpenCode not found in PATH"
    echo -e "   Install it from: ${BLUE}https://github.com/opencode-ai/opencode${NC}"
fi

# 7. Success!
echo ""
echo -e "${GREEN}┌─────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│${NC}  ✅ ${GREEN}Installation Complete!${NC}                          ${GREEN}│${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "📍 ${YELLOW}Extension installed to:${NC} $CONFIG_DIR"
echo ""
echo -e "🚀 ${GREEN}What to do next:${NC}"
echo ""
echo -e "   ${YELLOW}Step 1:${NC} Go to your project and start OpenCode"
echo -e "           ${BLUE}cd your-project && opencode${NC}"
echo ""
echo -e "   ${YELLOW}Step 2:${NC} Create a Python environment (if you don't have one)"
echo -e "           ${BLUE}python3 -m venv .venv${NC}"
echo -e "           ${BLUE}.venv/bin/pip install pandas numpy scikit-learn matplotlib seaborn${NC}"
echo ""
echo -e "   ${YELLOW}Step 3:${NC} Start your first research!"
echo -e "           ${BLUE}/gyoshu analyze wine quality factors in data/wine_quality.csv${NC}"
echo ""
echo -e "   ${YELLOW}Pro tip:${NC} Verify your setup with:"
echo -e "           ${BLUE}curl -fsSL https://raw.githubusercontent.com/Yeachan-Heo/My-Jogyo/main/install.sh | bash -s -- --check${NC}"
echo ""
echo -e "📖 ${YELLOW}Documentation:${NC} https://github.com/Yeachan-Heo/My-Jogyo"
echo ""
echo -e "${BLUE}Happy researching! 🎓${NC}"
echo ""
