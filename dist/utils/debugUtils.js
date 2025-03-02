"use strict";
// Path: src/utils/debugUtils.ts
// Provides debugging utilities for the Axe Handle generator.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLogger = exports.DebugLogger = void 0;
exports.withDebugLogging = withDebugLogging;
exports.enableDebugMode = enableDebugMode;
exports.disableDebugMode = disableDebugMode;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Enable debug mode based on environment variable
const DEBUG_MODE = process.env.AXE_HANDLE_DEBUG === 'true';
/**
 * Logger for debug information
 */
class DebugLogger {
    constructor() {
        this.enabled = DEBUG_MODE;
        this.logFile = path.join(process.cwd(), 'axe-handle-debug.log');
        // Clear log file on startup if debug is enabled
        if (this.enabled) {
            try {
                fs.writeFileSync(this.logFile, `=== Axe Handle Debug Log (${new Date().toISOString()}) ===\n\n`, 'utf-8');
            }
            catch (error) {
                console.warn('Failed to initialize debug log file');
            }
        }
    }
    /**
     * Gets the singleton instance of the DebugLogger.
     */
    static getInstance() {
        if (!DebugLogger.instance) {
            DebugLogger.instance = new DebugLogger();
        }
        return DebugLogger.instance;
    }
    /**
     * Enables or disables debug logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Logs a debug message if debug mode is enabled
     */
    log(message, context) {
        if (!this.enabled)
            return;
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] ${message}`;
        if (context) {
            logMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
        }
        // Output to console with [DEBUG] prefix
        console.log(`[DEBUG] ${message}`);
        // Append to log file
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n\n', 'utf-8');
        }
        catch (error) {
            console.warn('Failed to write to debug log file');
        }
    }
    /**
     * Creates a checkpoint in the debug log
     */
    checkpoint(name) {
        if (!this.enabled)
            return;
        const separator = '='.repeat(50);
        this.log(`${separator}\nCHECKPOINT: ${name}\n${separator}`);
    }
    /**
     * Logs detailed information about templates
     */
    logTemplateInfo(templateDir) {
        if (!this.enabled)
            return;
        this.checkpoint('Template Information');
        try {
            if (!fs.existsSync(templateDir)) {
                this.log(`Template directory not found: ${templateDir}`);
                return;
            }
            // Log directory structure
            this.log(`Template directory: ${templateDir}`);
            const templates = this.listFilesRecursively(templateDir);
            this.log(`Found ${templates.length} template files:`);
            templates.forEach(template => {
                this.log(`- ${path.relative(templateDir, template)}`);
            });
        }
        catch (error) {
            this.log(`Error getting template info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Lists all files in a directory recursively
     */
    listFilesRecursively(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                results = results.concat(this.listFilesRecursively(filePath));
            }
            else {
                results.push(filePath);
            }
        });
        return results;
    }
    /**
     * Logs detailed information about an error
     */
    logError(error, context) {
        if (!this.enabled)
            return;
        this.checkpoint(`ERROR${context ? ' in ' + context : ''}`);
        if ('code' in error) {
            const axeError = error;
            this.log(`Error Code: ${axeError.code}`);
            this.log(`Message: ${axeError.message}`);
            if (axeError.details) {
                this.log(`Details: ${JSON.stringify(axeError.details, null, 2)}`);
            }
            if (axeError.cause) {
                this.log('Caused by:', axeError.cause);
            }
        }
        else {
            this.log(`Error: ${error.message}`);
            this.log(`Stack: ${error.stack}`);
        }
    }
}
exports.DebugLogger = DebugLogger;
// Export singleton instance
exports.debugLogger = DebugLogger.getInstance();
/**
 * Wraps a function with debug logging
 */
function withDebugLogging(fn, functionName) {
    return (...args) => {
        if (!DEBUG_MODE)
            return fn(...args);
        exports.debugLogger.checkpoint(`BEGIN ${functionName}`);
        exports.debugLogger.log(`Arguments: ${JSON.stringify(args, null, 2)}`);
        try {
            const result = fn(...args);
            // Handle promises
            if (result instanceof Promise) {
                return result
                    .then(value => {
                    exports.debugLogger.log(`${functionName} completed successfully`);
                    return value;
                })
                    .catch(error => {
                    exports.debugLogger.logError(error, functionName);
                    throw error;
                });
            }
            exports.debugLogger.log(`${functionName} completed successfully`);
            return result;
        }
        catch (error) {
            exports.debugLogger.logError(error instanceof Error ? error : new Error(String(error)), functionName);
            throw error;
        }
    };
}
/**
 * Enable debug mode for the current session
 */
function enableDebugMode() {
    process.env.AXE_HANDLE_DEBUG = 'true';
    exports.debugLogger.setEnabled(true);
    exports.debugLogger.checkpoint('Debug Mode Enabled');
}
/**
 * Disable debug mode for the current session
 */
function disableDebugMode() {
    process.env.AXE_HANDLE_DEBUG = 'false';
    exports.debugLogger.setEnabled(false);
}
//# sourceMappingURL=debugUtils.js.map