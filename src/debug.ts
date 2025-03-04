// src/debug.ts
import * as path from 'path';
import * as fs from 'fs';
import * as eta from 'eta';
import chalk from 'chalk';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { getTemplateSystem } from './utils/templateSystem';

/**
 * Run a detailed debug to identify template loading issues
 */
async function runTemplateDebug() {
  console.log(chalk.cyan('=== Template Debug ==='));
  
  // Define paths
  const projectRoot = path.resolve(__dirname, '..');
  const templatesDir = path.join(projectRoot, 'templates');
  const schemaFile = path.join(projectRoot, 'schemas/examples/calendar.proto');
  
  console.log(`Project root: ${projectRoot}`);
  console.log(`Templates directory: ${templatesDir}`);
  console.log(`Schema file: ${schemaFile}`);
  
  // Check if directories exist
  console.log('\nChecking directories...');
  if (fs.existsSync(templatesDir)) {
    console.log(chalk.green(`✓ Templates directory exists`));
    
    // List templates
    const templates = fs.readdirSync(templatesDir);
    console.log(`Templates: ${templates.join(', ')}`);
    
    // Check express directory
    const expressDir = path.join(templatesDir, 'express');
    if (fs.existsSync(expressDir)) {
      console.log(chalk.green(`✓ Express templates directory exists`));
      
      // List express templates directories
      const expressDirs = fs.readdirSync(expressDir);
      console.log(`Express directories: ${expressDirs.join(', ')}`);
      
      // Check common template files
      for (const dir of expressDirs) {
        const dirPath = path.join(expressDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          console.log(`\nTemplate files in ${dir}:`);
          try {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
              console.log(`  ${file}`);
            });
          } catch (error) {
            console.log(chalk.red(`  Error reading directory: ${error.message}`));
          }
        }
      }
    } else {
      console.log(chalk.red(`✗ Express templates directory missing`));
    }
  } else {
    console.log(chalk.red(`✗ Templates directory missing`));
  }
  
  // Initialize the template system
  console.log('\nInitializing template system...');
  try {
    const templateSystem = getTemplateSystem({
      baseDir: templatesDir,
      framework: 'express',
      cache: false,
      helpers: {
        isRequestType: (type: string) => type.endsWith('Request'),
        isResponseType: (type: string) => type.endsWith('Result') || type.endsWith('Response'),
        getResponseTypeForRequest: (requestType: string) => requestType.replace('Request', 'Result'),
        getMethodFromRequest: (requestType: string) => {
          const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
          return methodParts.map(part => part.toLowerCase()).join('_');
        }
      }
    });
    console.log(chalk.green('✓ Template system initialized'));
    
    // Try to resolve some key templates
    console.log('\nResolving template paths...');
    const templates = ['types', 'server', 'handler', 'index', 'api'];
    for (const template of templates) {
      try {
        const templatePath = templateSystem.resolveTemplatePath(template);
        if (fs.existsSync(templatePath)) {
          console.log(chalk.green(`✓ Found template "${template}": ${templatePath}`));
        } else {
          console.log(chalk.red(`✗ Template path resolved but file not found: ${templatePath}`));
        }
      } catch (error) {
        console.log(chalk.red(`✗ Error resolving "${template}": ${error.message}`));
      }
    }
    
    // Initialize Eta config
    console.log('\nInitializing Eta...');
    eta.configure({
      views: templatesDir,
      cache: false,
      autoEscape: false
    });
    console.log(chalk.green('✓ Eta configured'));
    
  } catch (error) {
    console.log(chalk.red(`✗ Template system initialization failed: ${error.message}`));
    console.log(error.stack);
  }
  
  // Try to process the schema
  console.log('\nProcessing schema...');
  try {
    // Parse the MCP protocol
    console.log('Parsing MCP protocol...');
    let mcpSpec;
    try {
      mcpSpec = await mcpProtocolParser.parseProtocol();
      console.log(chalk.green('✓ MCP protocol parsed successfully'));
    } catch (error) {
      console.log(chalk.yellow('Full MCP parser failed, trying adapter...'));
      const schemaPath = path.resolve(projectRoot, 'schemas/mcp-spec/protocol.ts');
      mcpSpec = await extractMcpProtocol(schemaPath);
      console.log(chalk.green('✓ MCP protocol extracted using adapter'));
    }
    
    // Parse the user service
    console.log('\nParsing user service...');
    const userService = await serviceParser.parseService(schemaFile, mcpSpec);
    console.log(chalk.green(`✓ Service "${userService.name}" parsed with ${userService.resources.length} resources`));
    
    // Map to MCP concepts
    console.log('\nMapping to MCP concepts...');
    const mappedService = mapper.mapServiceToMcp(userService);
    console.log(chalk.green('✓ Service mapped successfully'));
    
    // Try rendering each template
    console.log('\nTesting template rendering...');
    const templateSystem = getTemplateSystem();
    
    // Test template rendering with a context object
    const context = {
      service: mappedService,
      date: new Date().toISOString(),
      version: '0.1.0'
    };
    
    for (const template of templates) {
      try {
        console.log(`Rendering "${template}"...`);
        const templatePath = templateSystem.resolveTemplatePath(template);
        console.log(`Template path: ${templatePath}`);
        
        if (fs.existsSync(templatePath)) {
          const content = fs.readFileSync(templatePath, 'utf-8');
          console.log(`First 100 chars: ${content.slice(0, 100).replace(/\n/g, ' ')}...`);
          
          // Try rendering
          const rendered = await templateSystem.render(template, context);
          console.log(chalk.green(`✓ Successfully rendered "${template}" (${rendered.length} chars)`));
        } else {
          console.log(chalk.red(`✗ Template file not found`));
        }
      } catch (error) {
        console.log(chalk.red(`✗ Error rendering "${template}": ${error.message}`));
        console.log(error.stack);
      }
    }
    
  } catch (error) {
    console.log(chalk.red(`✗ Schema processing failed: ${error.message}`));
    console.log(error.stack);
  }
}

// Run the debug
runTemplateDebug().catch(console.error);
