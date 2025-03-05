#!/bin/bash

# Fix mismatched quotes in imports
find src -name "*.ts" -type f | xargs grep -l "from '@" | while read file; do
  sed -i '' "s|from '@|from '@|g" "$file"
  sed -i '' "s|from \"@|from \"@|g" "$file"
done

# Make sure quotes match
find src -name "*.ts" -type f | while read file; do
  # Fix single quote imports
  sed -i '' "s|from '@\([^']*\)\"|\from '@\1'|g" "$file"
  # Fix double quote imports
  sed -i '' 's|from "@\([^"]*\)'\''|from "@\1"|g' "$file"
done