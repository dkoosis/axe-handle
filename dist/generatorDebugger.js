"use strict";
// Path: src/generatorDebugger.ts
// Debug utility for the Axe Handle generator
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const index_1 = require("./index");
// Hardcoded paths for easier debugging
const schemaFile = path_1.default.resolve(__dirname, '../schemas/examples/calendar.proto');
const outputDir = path_1.default.resolve(__dirname, '../debug-output');
// Create generator options
const options = {
    inputFile: schemaFile,
    outputDir: outputDir,
    overwrite: true,
    generateDocs: true,
    verbose: true
};
// Run the generator with verbose output
async function runGeneratorDebug() {
    try {
        console.log('Starting debug generation...');
        console.log(`Schema file: ${schemaFile}`);
        console.log(`Output directory: ${outputDir}`);
        await (0, index_1.generateMcpServer)(options);
        console.log('Generation completed successfully!');
    }
    catch (error) {
        console.error('Error during generation:');
        if (error instanceof Error) {
            console.error(`Name: ${error.name}`);
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
            // Output additional properties for AxeError
            if ('code' in error) {
                console.error(`Code: ${error.code}`);
            }
            if ('details' in error) {
                console.error(`Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            if ('cause' in error && error.cause) {
                console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
            }
        }
        else {
            console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
        }
    }
}
// Run the debug function
runGeneratorDebug();
//# sourceMappingURL=generatorDebugger.js.map