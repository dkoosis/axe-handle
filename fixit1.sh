#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting comprehensive import updates...${NC}"

TMPFILE=$(mktemp)

process_file() {
  local file=$1
  cp "$file" "$TMPFILE"
  
  # Update relative paths to utils
  sed -i '' \
    -e 's|from ['"'"'"]\.\.\/\.\.\/utils\/|from "@utils/|g' \
    -e 's|from ['"'"'"]\.\.\/utils\/|from "@utils/|g' \
    -e 's|from ['"'"'"]\.\/utils\/|from "@utils/|g' "$TMPFILE"
  
  # Update imports from types
  sed -i '' \
    -e 's|from ['"'"'"]\.\.\/\.\.\/types['"'"'"]|from "@axe/schema/types"|g' \
    -e 's|from ['"'"'"]\.\.\/types['"'"'"]|from "@axe/schema/types"|g' "$TMPFILE"
  
  # Update generator-related imports
  sed -i '' \
    -e 's|from ['"'"'"]\.\.\/\.\.\/generator\/generators|from "@generators/express|g' \
    -e 's|from ['"'"'"]\.\.\/generator\/generators|from "@generators/express|g' \
    -e 's|from ['"'"'"]\.\/generators|from "@generators/express|g' \
    -e 's|from ['"'"'"]\.\/baseGenerator['"'"'"]|from "@generators/express/baseGenerator"|g' \
    -e 's|from ['"'"'"]\.\.\/baseGenerator['"'"'"]|from "@generators/express/baseGenerator"|g' "$TMPFILE"
  
  # Update axe imports
  sed -i '' \
    -e 's|from ['"'"'"]\.\.\/\.\.\/axe\/|from "@axe/|g' \
    -e 's|from ['"'"'"]\.\.\/axe\/|from "@axe/|g' "$TMPFILE"
  
  # Update template imports
  sed -i '' \
    -e 's|from ['"'"'"]\.\.\/\.\.\/templates\/|from "@templates/|g' \
    -e 's|from ['"'"'"]\.\.\/templates\/|from "@templates/|g' "$TMPFILE"
  
  # Handle specific problem cases
  sed -i '' \
    -e 's|@axe/schema/schema/|@axe/schema/|g' \
    -e 's|import { TemplateSystem, getTemplateSystem } from ['"'"'"]\.\.\/\.\.\/utils\/templateSystem['"'"'"]|import { TemplateSystem, getTemplateSystem } from "@utils/templateSystem"|g' \
    -e 's|import \* as path from ['"'"'"]path['"'"'"]|import * as path from "path"|g' "$TMPFILE"
  
  # Check if file changed and copy back only if it did
  if ! cmp -s "$TMPFILE" "$file"; then
    cp "$TMPFILE" "$file"
    echo "Updated: $file"
  fi
}

# Process all TypeScript files
find src -name "*.ts" | while read file; do
  process_file "$file"
done

# Clean up
rm "$TMPFILE"

echo -e "${GREEN}Import updates completed!${NC}"