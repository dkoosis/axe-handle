#!/usr/bin/env node
/**
 * Script to fix TypeScript errors in the axe-handle project
 */
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
console.log(`Project root: ${projectRoot}`);

// Files that need fixing
const filesToFix = [
  'src/debug.ts',
  'src/utils/errorBoundary.ts',
  'src/utils/scripts/verify-templates.ts',
  'src/utils/templateEngine.ts'
];

// Create backups directory
const backupsDir = path.join(projectRoot, 'ts-fixes-backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Function to make backup of a file
function backupFile(filePath) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupsDir, `${fileName}.backup-${Date.now()}`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup: ${backupPath}`);
}

// Fix the debug.ts file
function fixDebugTs() {
  const filePath = path.join(projectRoot, 'src/debug.ts');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix error.message and error.stack references
  content = content.replace(
    /console\.log\(chalk\.red\(`[^`]*${error\.message}`\)\);/g,
    'console.log(chalk.red(`$1${error instanceof Error ? error.message : String(error)}`));'
  );
  
  content = content.replace(
    /console\.log\(error\.stack\);/g,
    'console.log(error instanceof Error ? error.stack : String(error));'
  );
  
  // Fix the templates variable not found issue
  content = content.replace(
    /for \(const template of templates\)/g,
    'const templatesList = templates || [];\nfor (const template of templatesList)'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix the errorBoundary.ts file
function fixErrorBoundaryTs() {
  const filePath = path.join(projectRoot, 'src/utils/errorBoundary.ts');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the indexing errors
  content = content.replace(
    /errorDetails\[key\] = error\[key\];/g,
    'errorDetails[key] = (error as Record<string, unknown>)[key];'
  );
  
  // Add better type guards
  content = content.replace(
    /if \(key !== 'stack' && key !== 'message'\) {/g,
    'if (key !== \'stack\' && key !== \'message\' && typeof error === \'object\' && error !== null && key in error) {'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix the verify-templates.ts file
function fixVerifyTemplatesTs() {
  const filePath = path.join(projectRoot, 'src/utils/scripts/verify-templates.ts');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the import path
  content = content.replace(
    /import TemplateEngine from '\.\/utils\/templateEngine';/g,
    'import TemplateEngine from \'../../utils/templateEngine\';'
  );
  
  // Fix the templates forEach
  content = content.replace(
    /templates\.slice\(0, 5\)\.forEach\(template => {/g,
    'templates.slice(0, 5).forEach((template: string) => {'
  );
  
  // Fix error.message and error.stack references
  content = content.replace(
    /console\.log\(chalk\.red\(`[^`]*${error\.message}`\)\);/g,
    'console.log(chalk.red(`$1${error instanceof Error ? error.message : String(error)}`));'
  );
  
  content = content.replace(
    /console\.log\(error\.stack\);/g,
    'console.log(error instanceof Error ? error.stack : String(error));'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix the templateEngine.ts file
function fixTemplateEngineTs() {
  const filePath = path.join(projectRoot, 'src/utils/templateEngine.ts');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix unused templatePath variable
  content = content.replace(
    /let templatePath = templateName;/g,
    '// Main template path, will be determined by findTemplate\n    // let templatePath = templateName;'
  );
  
  // Fix renderError type issues
  content = content.replace(
    /`Failed to render template: \${renderError\.message}`,/g,
    '`Failed to render template: ${renderError instanceof Error ? renderError.message : String(renderError)}`,');
  
  content = content.replace(
    /renderError: renderError\.message/g,
    'renderError: renderError instanceof Error ? renderError.message : String(renderError)'
  );
  
  content = content.replace(
    /renderError$/g,
    'renderError instanceof Error ? renderError : new Error(String(renderError))'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Main execution
try {
  console.log('Starting to fix TypeScript errors...');
  
  fixDebugTs();
  fixErrorBoundaryTs();
  fixVerifyTemplatesTs();
  fixTemplateEngineTs();
  
  console.log('\nAll fixes applied. Please run TypeScript compilation to verify fixes.');
  console.log(`Backups have been saved to: ${backupsDir}`);
} catch (error) {
  console.error('Error while applying fixes:', error);
  console.log('Please check the error and try again, or apply fixes manually.');
}
