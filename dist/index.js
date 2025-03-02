"use strict";
// Path: src/index.ts
// Main entry point for the Axe Handle code generator.
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapper = exports.generator = exports.serviceParser = exports.mcpSpecParser = exports.generateMcpServer = void 0;
exports.initialize = initialize;
const path = __importStar(require("path"));
const mcpSpecParser_1 = require("./parser/mcpSpecParser");
const serviceParser_1 = require("./parser/serviceParser");
const mapper_1 = require("./mcp/mapper");
const generator_1 = require("./generator/generator");
const configManager_1 = require("./utils/configManager");
const templateManager_1 = require("./utils/templateManager");
const errorUtils_1 = require("./utils/errorUtils");
/**
 * Initialize the application by setting up the template manager
 * and config manager with proper paths.
 */
function initialize() {
    // Initialize the template manager with the default templates directory
    const templatesDir = path.resolve(__dirname, '../templates');
    (0, templateManager_1.getTemplateManager)(templatesDir);
    // Initialize the config manager (no action needed, just ensures it's created)
    (0, configManager_1.getConfigManager)();
}
/**
 * Main function for generating an MCP server from a Protobuf schema.
 * Wrapped with error handling for better error reporting.
 *
 * @param options Configuration options for the generator
 */
exports.generateMcpServer = (0, errorUtils_1.withErrorHandling)(async (options) => {
    // Initialize the application
    initialize();
    // Load configuration file if provided
    const configManager = (0, configManager_1.getConfigManager)();
    if (options.configFile) {
        await configManager.loadConfigFile(options.configFile);
    }
    // Update configuration with options
    configManager.updateConfig({
    // Add any configuration from options
    // For now, we're just setting up the infrastructure
    });
    // Parse the MCP specification
    const mcpSpec = await mcpSpecParser_1.mcpSpecParser.parseSpecification();
    // Parse the user service
    const userService = await serviceParser_1.serviceParser.parseService(options.inputFile, mcpSpec);
    // Map the user service to MCP concepts
    const mappedService = mapper_1.mapper.mapServiceToMcp(userService);
    // Generate the server code
    await generator_1.generator.generateServer(mappedService, options);
}, errorUtils_1.createCliError);
// Export public modules and utilities
__exportStar(require("./types"), exports);
__exportStar(require("./types/schemaTypes"), exports);
__exportStar(require("./utils/errorUtils"), exports);
__exportStar(require("./utils/configManager"), exports);
__exportStar(require("./utils/templateManager"), exports);
var mcpSpecParser_2 = require("./parser/mcpSpecParser");
Object.defineProperty(exports, "mcpSpecParser", { enumerable: true, get: function () { return mcpSpecParser_2.mcpSpecParser; } });
var serviceParser_2 = require("./parser/serviceParser");
Object.defineProperty(exports, "serviceParser", { enumerable: true, get: function () { return serviceParser_2.serviceParser; } });
var generator_2 = require("./generator/generator");
Object.defineProperty(exports, "generator", { enumerable: true, get: function () { return generator_2.generator; } });
var mapper_2 = require("./mcp/mapper");
Object.defineProperty(exports, "mapper", { enumerable: true, get: function () { return mapper_2.mapper; } });
//# sourceMappingURL=index.js.map