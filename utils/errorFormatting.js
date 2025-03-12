#!/usr/bin/env node
// Path: utils/errorFormatting.js
// Shared error formatting for CLI and build processes

const chalk = require('chalk');

// Banner styles
const ERROR_BANNER = '🔴 ERROR';
const WARNING_BANNER = '🟠 WARNING';
const SUCCESS_BANNER = '🟢 SUCCESS';
const INFO_BANNER = '🔵 INFO';

/**
 * Format section header with consistent styling
 */
function formatSection(title) {
  const line = '═'.repeat(Math.max(50, title.length + 10));
  return `\n${chalk.cyan(line)}\n${chalk.cyan.bold(`   ${title}   `)}\n${chalk.cyan(line)}\n`;
}

/**
 * Format error with consistent styling
 */
function formatError(error, options = {}) {
  const { showStack = false, showBanner = true } = options;
  
  let output = '';
  
  if (showBanner) {
    output += `\n${chalk.bgRed.white(` ${ERROR_BANNER} `)} `;
  }
  
  if (error.code) {
    output += `${chalk.red(error.code)}: `;
  }
  
  output += chalk.red(error.message || String(error));
  
  if (error.details && Object.keys(error.details).length > 0) {
    output += '\n\nDetails:';
    for (const [key, value] of Object.entries(error.details)) {
      output += `\n  ${chalk.cyan(key)}: ${value}`;
    }
  }
  
  if (showStack && error.stack) {
    const stack = error.stack.split('\n').slice(1).join('\n');
    output += `\n\n${chalk.gray(stack)}`;
  }
  
  return output;
}

/**
 * Format success message with consistent styling
 */
function formatSuccess(message) {
  return `${chalk.bgGreen.black(` ${SUCCESS_BANNER} `)} ${chalk.green(message)}`;
}

/**
 * Format warning message with consistent styling
 */
function formatWarning(message) {
  return `${chalk.bgYellow.black(` ${WARNING_BANNER} `)} ${chalk.yellow(message)}`;
}

/**
 * Format info message with consistent styling
 */
function formatInfo(message) {
  return `${chalk.bgBlue.white(` ${INFO_BANNER} `)} ${chalk.blue(message)}`;
}

/**
 * Format validation result with appropriate styling
 */
function formatValidation(type, message, details = null) {
  let output = '';
  
  switch (type) {
    case 'success':
      output = `${chalk.green('✓')} ${message}`;
      break;
    case 'error':
      output = `${chalk.red('✗')} ${message}`;
      break;
    case 'warning':
      output = `${chalk.yellow('⚠')} ${message}`;
      break;
    case 'info':
      output = `${chalk.blue('ℹ')} ${message}`;
      break;
    default:
      output = message;
  }
  
  if (details) {
    output += `\n  ${chalk.gray(details)}`;
  }
  
  return output;
}

module.exports = {
  formatSection,
  formatError,
  formatSuccess,
  formatWarning,
  formatInfo,
  formatValidation
};