// src/verifyTemplates.ts
// Run this script to verify your template setup

import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
import TemplateEngine from './utils/templateEngine';

/**
 * Verify the template directory structure and contents
 */
async function verifyTemplates(): Promise<void> {
  console.log(chalk.cyan('==== Template Verification ===='));
  
  // Find project root and templates directory
  const projectRoot = path.resolve(__dirname, '..');
  const templatesDir = path.join(projectRoot, 'templates');
  
  console.log(`Project root: ${projectRoot}`);
  console.log(`Templates directory: ${templatesDir}`);
  
  // Check if templates directory exists
  if (!fs.existsSync(templatesDir)) {
    console.log(chalk.red(`✗ Templates directory doesn't exist!`));
    console.log(chalk.yellow(`Creating templates directory...`));
    fs.mkdirSync(templatesDir, { recursive: true });
  } else {
    console.log(chalk.green(`✓ Templates directory exists`));
  }
  
  // Check for express directory
  const expressDir = path.join(templatesDir, 'express');
  if (!fs.existsSync(expressDir)) {
    console.log(chalk.red(`✗ Express templates directory doesn't exist!`));
    console.log(chalk.yellow(`Creating express templates directory...`));
    fs.mkdirSync(expressDir, { recursive: true });
  } else {
    console.log(chalk.green(`✓ Express templates directory exists`));
  }
  
  // Check for required category directories
  const requiredDirs = ['server', 'handler', 'types', 'index', 'api'];
  for (const dir of requiredDirs) {
    const categoryDir = path.join(expressDir, dir);
    if (!fs.existsSync(categoryDir)) {
      console.log(chalk.red(`✗ Missing directory: ${dir}`));
      console.log(chalk.yellow(`Creating ${dir} directory...`));
      fs.mkdirSync(categoryDir, { recursive: true });
    } else {
      console.log(chalk.green(`✓ Directory exists: ${dir}`));
    }
  }
  
  // Check for required template files
  const requiredTemplateFiles = [
    { category: 'server', name: 'server.eta' },
    { category: 'handler', name: 'handler.eta' },
    { category: 'types', name: 'types.eta' },
    { category: 'index', name: 'index.eta' },
    { category: 'api', name: 'api.eta' }
  ];
  
  let missingTemplates = false;
  
  for (const template of requiredTemplateFiles) {
    const templatePath = path.join(expressDir, template.category, template.name);
    if (!fs.existsSync(templatePath)) {
      console.log(chalk.red(`✗ Missing template: ${templatePath}`));
      missingTemplates = true;
    } else {
      console.log(chalk.green(`✓ Template exists: ${template.category}/${template.name}`));
    }
  }
  
  // Report summary
  if (missingTemplates) {
    console.log(chalk.yellow('\nSome template files are missing! You need to create them or run the template setup script:'));
    console.log(chalk.cyan('npm run setup-templates'));
  } else {
    console.log(chalk.green('\nAll required template files exist!'));
  }
  
  // Test template engine
  console.log(chalk.cyan('\n==== Testing Template Engine ===='));
  const templateEngine = new TemplateEngine(templatesDir, true);
  
  try {
    console.log(chalk.cyan('Loading templates...'));
    templateEngine.loadTemplates();
    
    const templates = templateEngine.listLoadedTemplates();
    console.log(chalk.green(`✓ Successfully loaded ${templates.length} templates`));
    
    if (templates.length > 0) {
      console.log(chalk.green('First 5 templates:'));
      templates.slice(0, 5).forEach(template => {
        console.log(`  - ${template}`);
      });
    }
  } catch (error) {
    console.log(chalk.red(`✗ Error loading templates: ${error.message}`));
    console.log(error.stack);
  }
  
  console.log(chalk.cyan('\n==== Verification Complete ===='));
}

// Run the verification
verifyTemplates().catch(error => {
  console.error(chalk.red('Verification failed with error:'), error);
});
