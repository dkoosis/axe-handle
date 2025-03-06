#!/bin/bash
# File: reorganize.sh

# Create necessary directories
mkdir -p src/generators/common
mkdir -p src/generators/express
mkdir -p src/parser/protocol
mkdir -p src/mcp
mkdir -p src/utils/templates

# Clean up system files
find . -name ".DS_Store" -type f -delete
find . -name "*.bak" -type f -delete

# Move files to correct locations
# BaseGenerator
cp src/generators/common/baseGenerator.ts src/generators/common/
rm -f src/generator/generators/baseGenerator.ts
rm -f src/engine/generators/common/baseGenerator.ts

# Express generators
cp src/generators/express/*.ts src/generators/express/
rm -f src/generator/generators/*.ts
rm -f src/engine/generators/express/*.ts

# Parser files
cp src/parser/protocol/*.ts src/parser/protocol/
cp src/parser/serviceParser.ts src/parser/
rm -f src/axe/schema/protocolAdapter.ts
rm -f src/axe/schema/protocolCache.ts
rm -f src/axe/schema/protocolParser.ts
rm -f src/parser/services/serviceParser.ts

# MCP mapper
cp src/mcp/mapper.ts src/mcp/
rm -f src/axe/mappings/resourceMapper.ts

# Utils
cp src/utils/*.ts src/utils/
cp src/utils/templates/*.ts src/utils/templates/
rm -f src/axe/engine/templates/*.ts
rm -f src/axe/engine/templateSystem.ts

# Core files
cp src/types.ts src/
rm -f src/axe/schema/types.ts

# Clean up empty directories
find src -type d -empty -delete

echo "File reorganization complete."