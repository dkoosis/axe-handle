// update-package-json.js
const fs = require('fs');
const path = require('path');

/**
 * Updates the package.json file to include a setup-templates script
 */
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  // Read the existing package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add a setup-templates script if it doesn't exist
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts['setup-templates'] = 'node setup-templates.js';
  
  // Write the updated package.json back to disk
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('Updated package.json with setup-templates script');
}

// Run the function if this file is executed directly
if (require.main === module) {
  updatePackageJson();
}

module.exports = updatePackageJson;
