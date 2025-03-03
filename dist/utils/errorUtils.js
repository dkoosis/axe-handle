"use strict";
// Path: src/utils/errorUtils.ts
// Provides centralized error handling utilities for the Axe Handle code generator.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = createError;
exports.createParserError = createParserError;
exports.createCliError = createCliError;
exports.createGeneratorError = createGeneratorError;
exports.createMapperError = createMapperError;
exports.createMcpSpecError = createMcpSpecError;
exports.createMcpRuntimeError = createMcpRuntimeError;
exports.formatErrorForCli = formatErrorForCli;
exports.withErrorHandling = withErrorHandling;
const types_1 = require("../types");
/**
 * Creates an Axe Handle error.
 * @param prefix Error prefix (AXE or MCP)
 * @param category Error category
 * @param code Numeric error code within the category
 * @param message Human-readable error message
 * @param details Additional details about the error (e.g., file name, line number)
 * @param cause Underlying error, if any
 * @returns A structured AxeError object
 */
function createError(prefix, category, code, message, details, cause) {
    return {
        code: `${prefix}-${category}${String(code).padStart(3, '0')}`,
        message,
        details,
        cause,
    };
}
/**
 * Creates an Axe Handle parser error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createParserError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.AXE, types_1.AxeErrorCategory.PARSER, code, message, details, cause);
}
/**
 * Creates an Axe Handle CLI error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createCliError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.AXE, types_1.AxeErrorCategory.CLI, code, message, details, cause);
}
/**
 * Creates an Axe Handle generator error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createGeneratorError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.AXE, types_1.AxeErrorCategory.GENERATOR, code, message, details, cause);
}
/**
 * Creates an Axe Handle mapper error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createMapperError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.AXE, types_1.AxeErrorCategory.MAPPER, code, message, details, cause);
}
/**
 * Creates an MCP protocol error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createMcpSpecError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.MCP, types_1.McpErrorCategory.SPECIFICATION, code, message, details, cause);
}
/**
 * Creates an MCP runtime error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createMcpRuntimeError(code, message, details, cause) {
    return createError(types_1.ErrorPrefix.MCP, types_1.McpErrorCategory.RUNTIME, code, message, details, cause);
}
/**
 * Formats an error message for CLI display with proper coloring.
 * This function should be used in the CLI module to format error messages
 * before displaying them to the user.
 *
 * @param error The error to format
 * @returns Formatted error message ready for CLI display
 */
function formatErrorForCli(error) {
    // This implementation would use chalk for colors
    // but we're leaving it as a stub for now
    if ('code' in error) {
        const axeError = error;
        let message = `ERROR ${axeError.code}: ${axeError.message}`;
        if (axeError.details) {
            message += '\n\nDetails:';
            for (const [key, value] of Object.entries(axeError.details)) {
                message += `\n  ${key}: ${value}`;
            }
        }
        if (axeError.cause) {
            message += `\n\nCaused by: ${formatErrorForCli(axeError.cause)}`;
        }
        return message;
    }
    else {
        return `ERROR: ${error.message}`;
    }
}
/**
 * Wraps a function with error handling logic.
 * If the function throws an error, it will be caught and wrapped in an AxeError.
 *
 * @param fn The function to wrap
 * @param errorCreator A function that creates an AxeError
 * @returns A wrapped function
 */
function withErrorHandling(fn, errorCreator) {
    return (...args) => {
        try {
            return fn(...args);
        }
        catch (error) {
            if (error instanceof Error && 'code' in error) {
                // Error is already an AxeError, rethrow
                throw error;
            }
            throw errorCreator(999, // Generic error code
            'An unexpected error occurred', { function: fn.name }, error instanceof Error ? error : new Error(String(error)));
        }
    };
}
//# sourceMappingURL=errorUtils.js.map