"use strict";
// Path: src/types.ts
// Contains shared TypeScript type definitions used throughout the project.
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpErrorCategory = exports.AxeErrorCategory = exports.ErrorPrefix = void 0;
/**
 * Error code prefixes used throughout the application.
 * AXE-*: Internal Axe Handle errors
 * MCP-*: MCP protocol or generated server errors
 */
var ErrorPrefix;
(function (ErrorPrefix) {
    ErrorPrefix["AXE"] = "AXE";
    ErrorPrefix["MCP"] = "MCP";
})(ErrorPrefix || (exports.ErrorPrefix = ErrorPrefix = {}));
/**
 * Error categories for Axe Handle.
 */
var AxeErrorCategory;
(function (AxeErrorCategory) {
    AxeErrorCategory[AxeErrorCategory["PARSER"] = 1] = "PARSER";
    AxeErrorCategory[AxeErrorCategory["CLI"] = 2] = "CLI";
    AxeErrorCategory[AxeErrorCategory["GENERATOR"] = 3] = "GENERATOR";
    AxeErrorCategory[AxeErrorCategory["MAPPER"] = 4] = "MAPPER";
})(AxeErrorCategory || (exports.AxeErrorCategory = AxeErrorCategory = {}));
/**
 * Error categories for MCP.
 */
var McpErrorCategory;
(function (McpErrorCategory) {
    McpErrorCategory[McpErrorCategory["PROTOCOL"] = 1] = "PROTOCOL";
    McpErrorCategory[McpErrorCategory["RUNTIME"] = 4] = "RUNTIME";
})(McpErrorCategory || (exports.McpErrorCategory = McpErrorCategory = {}));
//# sourceMappingURL=types.js.map