#!/bin/bash
set -e

echo "Starting Axe-Handle project restructuring..."

# Create new directory structure
mkdir -p src/cli
mkdir -p src/mcpServerGenerator
mkdir -p src/parsers/modelContextProtocol
mkdir -p src/templateProcessor
mkdir -p src/types
mkdir -p src/utils

# Move CLI files
echo "Moving CLI files..."
mv src/cli.ts src/cli/index.ts 2>/dev/null || echo "CLI main file already moved or doesn't exist"
mv src/cli/* src/cli/ 2>/dev/null || echo "No additional CLI files to move"

# Consolidate and move generator files
echo "Consolidating generator files..."
if [ -f src/engine/mcpServerGenerator.ts ]; then
  mv src/engine/mcpServerGenerator.ts src/mcpServerGenerator/serverGenerator.ts
fi

if [ -f src/generator/mcpServerGenerator.ts ]; then
  mv src/generator/mcpServerGenerator.ts src/mcpServerGenerator/handlerGenerator.ts
fi

# Move files from generators directory if they exist
if [ -d src/generators/express ]; then
  cp -r src/generators/express/* src/mcpServerGenerator/ 2>/dev/null || echo "No express generator files to copy"
fi

if [ -d src/generators/common ]; then
  cp -r src/generators/common/* src/mcpServerGenerator/ 2>/dev/null || echo "No common generator files to copy"
fi

# Move parser files
echo "Moving parser files..."
if [ -d src/parser/protocol ]; then
  mv src/parser/protocol/* src/parsers/modelContextProtocol/ 2>/dev/null || echo "No protocol files to move"
fi

# Copy the schema JSON files
echo "Copying schema files..."
if [ -d schemas/mcp-spec ]; then
  cp schemas/mcp-spec/protocol.json src/parsers/modelContextProtocol/ 2>/dev/null || echo "Protocol JSON not found"
fi

# Move template processor files
echo "Moving template processor files..."
if [ -d src/utils/templates ]; then
  mv src/utils/templates/templateLoader.ts src/templateProcessor/ 2>/dev/null || echo "Template loader not found"
  mv src/utils/templates/templateRenderer.ts src/templateProcessor/ 2>/dev/null || echo "Template renderer not found"
  mv src/utils/templates/templateSystem.ts src/templateProcessor/templateProcessor.ts 2>/dev/null || echo "Template system not found"
  mv src/utils/templates/*.ts src/templateProcessor/ 2>/dev/null || echo "No additional template files to move"
fi

# Move types files
echo "Moving type files..."
if [ -f src/types.ts ]; then
  mv src/types.ts src/types/index.ts 2>/dev/null || echo "Main types file already moved"
fi

if [ -d src/types ]; then
  mv src/types/* src/types/ 2>/dev/null || echo "No additional type files to move"
fi

# Keep utility files in place, just remove templates subfolder
echo "Organizing utility files..."
if [ -d src/utils/templates ]; then
  rm -rf src/utils/templates 2>/dev/null || echo "Templates folder already removed"
fi

echo "Basic restructuring complete!"
echo "Now running import path fixer..."

# Run the TypeScript import path fixer script
node fix-imports.js

echo "Restructuring complete! Please check for any errors and manually move any missed files."
