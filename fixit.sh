#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting import path updates...${NC}"

# Create a temporary directory for sed scripts
mkdir -p temp_sed_scripts

# Create sed script files for each pattern
cat > temp_sed_scripts/utils.sed << 'EOF'
s|from '\.\./\.\./utils|from '@utils|g
s|from "\.\./\.\./utils|from "@utils|g
s|from '\.\./utils|from '@utils|g
s|from "\.\./utils|from "@utils|g
EOF

cat > temp_sed_scripts/types.sed << 'EOF'
s|from '\.\./\.\./types'|from '@axe/schema/types'|g
s|from "\.\./\.\./types"|from "@axe/schema/types"|g
s|from '\.\./types'|from '@axe/schema/types'|g
s|from "\.\./types"|from "@axe/schema/types"|g
EOF

cat > temp_sed_scripts/generators.sed << 'EOF'
s|from '\.\./\.\./generator/generators|from '@generators/express|g
s|from "\.\./\.\./generator/generators|from "@generators/express|g
s|from '\./generators|from '@generators/express|g
s|from "\./generators|from "@generators/express|g
EOF

cat > temp_sed_scripts/baseGenerator.sed << 'EOF'
s|from '\./baseGenerator'|from '@generators/express/baseGenerator'|g
s|from "\./baseGenerator"|from "@generators/express/baseGenerator"|g
EOF

cat > temp_sed_scripts/axe.sed << 'EOF'
s|from '\.\./\.\./axe/|from '@axe/|g
s|from "\.\./\.\./axe/|from "@axe/|g
EOF

# Run the scripts on all TypeScript files
echo -e "${YELLOW}Updating imports...${NC}"
find src -name "*.ts" -type f | while read file; do
  sed -i '' -f temp_sed_scripts/utils.sed "$file"
  sed -i '' -f temp_sed_scripts/types.sed "$file"
  sed -i '' -f temp_sed_scripts/generators.sed "$file"
  sed -i '' -f temp_sed_scripts/baseGenerator.sed "$file"
  sed -i '' -f temp_sed_scripts/axe.sed "$file"
done

# Clean up
rm -rf temp_sed_scripts

echo -e "${GREEN}Import updates completed!${NC}"
echo -e "${YELLOW}Please review changes manually for any patterns that may have been missed.${NC}"