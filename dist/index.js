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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapper = exports.generator = exports.serviceParser = exports.mcpSpecParser = void 0;
exports.generateMcpServer = generateMcpServer;
const mcpSpecParser_1 = require("./parser/mcpSpecParser");
const serviceParser_1 = require("./parser/serviceParser");
const mapper_1 = require("./mcp/mapper");
const generator_1 = require("./generator/generator");
/**
 * Main function for generating an MCP server from a Protobuf schema.
 * @param options Configuration options for the generator
 */
async function generateMcpServer(options) {
    try {
        // Parse the MCP specification
        const mcpSpec = await mcpSpecParser_1.mcpSpecParser.parseSpecification();
        // Parse the user service
        const userService = await serviceParser_1.serviceParser.parseService(options.inputFile, mcpSpec);
        // Map the user service to MCP concepts
        const mappedService = mapper_1.mapper.mapServiceToMcp(userService, mcpSpec);
        // Generate the server code
        await generator_1.generator.generateServer(mappedService, options);
    }
    catch (error) {
        throw error;
    }
}
// Export public modules
__exportStar(require("./types"), exports);
var mcpSpecParser_2 = require("./parser/mcpSpecParser");
Object.defineProperty(exports, "mcpSpecParser", { enumerable: true, get: function () { return mcpSpecParser_2.mcpSpecParser; } });
var serviceParser_2 = require("./parser/serviceParser");
Object.defineProperty(exports, "serviceParser", { enumerable: true, get: function () { return serviceParser_2.serviceParser; } });
var generator_2 = require("./generator/generator");
Object.defineProperty(exports, "generator", { enumerable: true, get: function () { return generator_2.generator; } });
var mapper_2 = require("./mcp/mapper");
Object.defineProperty(exports, "mapper", { enumerable: true, get: function () { return mapper_2.mapper; } });
//# sourceMappingURL=index.js.map