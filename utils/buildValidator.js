#!/usr/bin/env node
// Path: utils/buildValidator.js
// Build validation manager with clear error reporting

const chalk = require('chalk');
const { execSync } = require('child_process');
const { formatSection, formatError, formatSuccess, formatValidation } = require('./errorFormatting');

/**
 * Run a validation step with proper error handling
 */
function runValidation(name, command, options = {}) {
  const { silent = false, ignoreErrors = false } = options;
  
  console.log(formatValidation('info', `Running ${name} validation...`));
  
  try {
    // Run the command
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    
    console.log(formatSuccess(`${name} validation passed!`));
    return { success: true, output };
  } catch (error) {
    const errorMessage = `${name} validation failed!`;
    console.error(formatError({ 
      message: errorMessage,
      details: { command, exitCode: error.status }
    }));
    
    console.error(chalk.red('\nError details:'));
    if (error.stdout) {
      console.error(chalk.gray(error.stdout.toString()));
    }
    
    if (error.stderr) {
      console.error(chalk.red(error.stderr.toString()));
    }
    
    console.error(chalk.red('\n' + '─'.repeat(50)));
    console.error(chalk.red('Build process interrupted during validation!'));
    console.error(chalk.yellow('Fix the errors above to continue the build process.'));
    
    if (!ignoreErrors) {
      process.exit(1);
    }
    
    return { success: false, error };
  }
}

/**
 * Run all validations in sequence
 */
function validateAll() {
  console.log(formatSection('Building Axe Handle Project'));
  
  const validations = [
    { name: 'TypeScript', command: 'pnpm run type-check' },
    { name: 'ESLint', command: 'pnpm run lint' },
    { name: 'Path Headers', command: 'pnpm run check-paths' },
    { name: 'Directory Structure', command: 'pnpm run check-structure' }
  ];
  
  console.log(formatSection('Validation Phase'));
  
  let allPassed = true;
  
  for (const validation of validations) {
    const result = runValidation(validation.name, validation.command);
    if (!result.success) {
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    console.log(formatSection('Validation Complete'));
    console.log(formatSuccess('All validation checks passed successfully!'));
    return true;
  }
  
  return false;
}

// If executed directly
if (require.main === module) {
  validateAll();
}

module.exports = {
  runValidation,
  validateAll
};