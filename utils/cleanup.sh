#!/bin/bash
set -e

echo "Starting cleanup of old directories..."

# Remove old directories that are no longer needed
if [ -d src/axe ]; then
  echo "Removing src/axe directory..."
  rm -rf src/axe
fi

if [ -d src/engine ]; then
  echo "Removing src/engine directory..."
  rm -rf src/engine
fi

if [ -d src/generator ]; then
  echo "Removing src/generator directory..."
  rm -rf src/generator
fi

if [ -d src/generators ]; then
  echo "Removing src/generators directory..."
  rm -rf src/generators
fi

if [ -d src/parser ]; then
  echo "Removing src/parser directory..."
  rm -rf src/parser
fi

if [ -d src/mcp ]; then
  echo "Checking if src/mcp content should be moved..."
  if [ -f src/mcp/mapper.ts ]; then
    echo "Moving mapper.ts to parsers/modelContextProtocol"
    cp src/mcp/mapper.ts src/parsers/modelContextProtocol/adapter.ts
  fi
  echo "Removing src/mcp directory..."
  rm -rf src/mcp
fi

# Find and fix any remaining duplicate files
echo "Checking for duplicate implementations..."

# Find potential duplicates by filename
DUPLICATES=$(find src -type f -name "*.ts" | sort | uniq -d -f1)

if [ -n "$DUPLICATES" ]; then
  echo "Found potential duplicate files. Please review them manually:"
  echo "$DUPLICATES"
else
  echo "No obvious duplicate files found."
fi

# Check the project structure matches the expected structure
echo "Validating directory structure..."
EXPECTED_DIRS=(
  "src/cli"
  "src/mcpServerGenerator"
  "src/parsers/modelContextProtocol"
  "src/templateProcessor"
  "src/types"
  "src/utils"
)

for dir in "${EXPECTED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "Warning: Expected directory $dir is missing!"
  else
    echo "✓ $dir exists"
  fi
done

echo "Cleanup complete! The project structure should now align with the documentation."
echo "Next steps:"
echo "1. Run 'npm install' to update dependencies if needed"
echo "2. Run 'npm run build' to verify the build works with the new structure"
echo "3. Update any remaining import paths that might have been missed"
