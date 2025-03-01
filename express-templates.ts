// package.json.ejs
{
  "name": "<%= config.projectName %>",
  "version": "<%= config.version %>",
  "description": "<%= config.description %>",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "author": "<%= config.author %>",
  "license": "<%= config.license %>",
  "dependencies": {
    "express": "^4.18.2",
    "express-ws": "^5.0.2",
    "ws": "^8.13.0",
    "winston": "^3.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/express-ws": "^3.0.1",
    "@types/jest": "^29.5.3",
    "@types/node": "^20.4.9",
    "@types/uuid": "^9.0.2",
    "@types/ws": "^8.5.5",
    "jest": "^29.6.2",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}

// tsconfig.json.ejs
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "sourceMap": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}

// gitignore.ejs
# Dependency directories
node_modules/

# Build outputs
dist/
build/

# Logs
logs
*.log
npm-debug.log*

# Environment variables
.env
.env.local

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo

# Operating System Files
.DS_Store
Thumbs.db

// README.md.ejs
# <%= config.projectName %>

A Model Context Protocol (MCP) server implementation generated with Axe Handle.

## Description

<%= config.description %>

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

```bash
npm install
```

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## Configuration

The server can be configured using environment variables:

- `PORT`: The port to listen on (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)
- `NODE_ENV`: Environment (development, production)

## MCP Protocol Information

- Protocol Version: <%= protocolVersion %>
- Generated on: <%= timestamp %>
- Framework: <%= framework %>

## License

This project is licensed under the <%= config.license %> License.

// src/index.ts.ejs
import { createServer } from './server';
import { logger } from './utils';

// Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Start the server
const server = createServer();

server.listen(PORT, () => {
  logger.info(`MCP Server running on port ${PORT}`);
  logger.info(`Protocol Version: <%= protocolVersion %>`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// src/server.ts.ejs
import express from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionHandler } from './handlers/connection-handler';
import { MessageHandler } from './handlers/message-handler';
import { StateManager } from './state-manager';
import { logger } from './utils';

/**
 * Create and configure the MCP server
 */
export function createServer() {
  // Create Express app with WebSocket support
  const app = express();
  const wsInstance = expressWs(app);
  
  // Create state manager
  const stateManager = new StateManager();
  
  // Configure middleware
  app.use(express.json());
  
  // Basic health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '<%= protocolVersion %>' });
  });
  
  // WebSocket endpoint for MCP connections
  app.ws('/mcp', (ws: WebSocket, req: express.Request) => {
    const connectionId = uuidv4();
    logger.info(`New MCP connection established: ${connectionId}`);
    
    // Create connection handler
    const connectionHandler = new ConnectionHandler(ws, connectionId, stateManager);
    
    // Create message handler
    const messageHandler = new MessageHandler(connectionHandler, stateManager);
    
    // Setup event handlers
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        messageHandler.handleMessage(data);
      } catch (error) {
        logger.error(`Error handling message: ${error}`);
        connectionHandler.sendErrorResponse({
          code: -32700,
          message: 'Parse error',
          data: { error: String(error) }
        });
      }
    });
    
    ws.on('close', () => {
      logger.info(`MCP connection closed: ${connectionId}`);
      stateManager.removeConnection(connectionId);
    });
    
    ws.on('error', (error) => {
      logger.error(`WebSocket error on connection ${connectionId}: ${error}`);
      stateManager.removeConnection(connectionId);
    });
  });
  
  return app;
}

// src/utils.ts.ejs
import winston from 'winston';

// Configure logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Check if a given string is a valid JSON-RPC method
 * @param method Method name to check
 * @returns True if valid, false otherwise
 */
export function isValidMethod(method: string): boolean {
  // Implement method validation logic here
  return !!method && typeof method === 'string';
}

/**
 * Generate a random ID for JSON-RPC requests
 * @returns A random ID string
 */
export function generateRequestId(): string {
  return Math.floor(Math.random() * 10000).toString();
}

// src/capabilities.ts.ejs
import { ServerCapabilities, LATEST_PROTOCOL_VERSION } from './schema/mcp-schema';

/**
 * Manages server capabilities for MCP
 */
export class CapabilityManager {
  private capabilities: ServerCapabilities;
  
  constructor() {
    // Initialize default capabilities
    this.capabilities = {
      logging: {},
      <% if (schema.interfaces.ListResourcesResult) { %>
      resources: {
        listChanged: true
      },
      <% } %>
      <% if (schema.interfaces.ListPromptsResult) { %>
      prompts: {
        listChanged: true
      },
      <% } %>
      <% if (schema.interfaces.ListToolsResult) { %>
      tools: {
        listChanged: true
      },
      <% } %>
      experimental: {}
    };
  }
  
  /**
   * Get the server capabilities
   */
  getCapabilities(): ServerCapabilities {
    return { ...this.capabilities };
  }
  
  /**
   * Update server capabilities
   */
  updateCapabilities(capabilities: Partial<ServerCapabilities>): void {
    this.capabilities = {
      ...this.capabilities,
      ...capabilities
    };
  }
  
  /**
   * Get the protocol version
   */
  getProtocolVersion(): string {
    return LATEST_PROTOCOL_VERSION;
  }
}

// src/state-manager.ts.ejs
import { ConnectionHandler } from './handlers/connection-handler';

/**
 * Manages state for MCP server connections
 */
export class StateManager {
  private connections: Map<string, ConnectionState>;
  
  constructor() {
    this.connections = new Map();
  }
  
  /**
   * Add a connection
   */
  addConnection(connectionId: string, handler: ConnectionHandler): void {
    this.connections.set(connectionId, {
      id: connectionId,
      handler,
      initialized: false,
      clientCapabilities: {}
    });
  }
  
  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }
  
  /**
   * Get a connection state
   */
  getConnection(connectionId: string): ConnectionState | undefined {
    return this.connections.get(connectionId);
  }
  
  /**
   * Mark a connection as initialized
   */
  setInitialized(connectionId: string, initialized: boolean = true): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.initialized = initialized;
    }
  }
  
  /**
   * Update client capabilities for a connection
   */
  updateClientCapabilities(connectionId: string, capabilities: any): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.clientCapabilities = capabilities;
    }
  }
  
  /**
   * Get all connections
   */
  getAllConnections(): ConnectionState[] {
    return Array.from(this.connections.values());
  }
}

/**
 * Connection state interface
 */
interface ConnectionState {
  id: string;
  handler: ConnectionHandler;
  initialized: boolean;
  clientCapabilities: any;
}

// src/handlers/connection-handler.ts.ejs
import { WebSocket } from 'ws';
import { JSONRPCError, JSONRPCRequest, JSONRPCResponse, RequestId } from '../schema/mcp-schema';
import { StateManager } from '../state-manager';
import { logger } from '../utils';

/**
 * Handles MCP WebSocket connections
 */
export class ConnectionHandler {
  private ws: WebSocket;
  private connectionId: string;
  private stateManager: StateManager;
  
  constructor(ws: WebSocket, connectionId: string, stateManager: StateManager) {
    this.ws = ws;
    this.connectionId = connectionId;
    this.stateManager = stateManager;
    
    // Register this connection
    this.stateManager.addConnection(connectionId, this);
  }
  
  /**
   * Send a JSON-RPC response
   */
  sendResponse(id: RequestId, result: any): void {
    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id,
      result
    };
    
    this.sendMessage(response);
  }
  
  /**
   * Send a JSON-RPC error response
   */
  sendErrorResponse(error: { code: number; message: string; data?: any }, id?: RequestId): void {
    const errorResponse: JSONRPCError = {
      jsonrpc: '2.0',
      id: id || null,
      error
    };
    
    this.sendMessage(errorResponse);
  }
  
  /**
   * Send a JSON-RPC notification
   */
  sendNotification(method: string, params?: any): void {
    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };
    
    this.sendMessage(notification);
  }
  
  /**
   * Send a JSON-RPC request
   */
  sendRequest(id: RequestId, method: string, params?: any): void {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    this.sendMessage(request);
  }
  
  /**
   * Send a raw message over the WebSocket
   */
  private sendMessage(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        logger.debug(`Sent message to ${this.connectionId}`, { message });
      } catch (error) {
        logger.error(`Error sending message to ${this.connectionId}: ${error}`);
      }
    } else {
      logger.warn(`Cannot send message to ${this.connectionId}: WebSocket not open`);
    }
  }
  
  /**
   * Get the connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }
  
  /**
   * Close the connection
   */
  close(code?: number, reason?: string): void {
    this.ws.close(code, reason);
    this.stateManager.removeConnection(this.connectionId);
  }
}

// src/handlers/message-handler.ts.ejs
import { JSONRPCMessage, JSONRPCRequest, JSONRPCNotification } from '../schema/mcp-schema';
import { ConnectionHandler } from './connection-handler';
import { StateManager } from '../state-manager';
import { logger, isValidMethod } from '../utils';
import { CapabilityManager } from '../capabilities';

// Import method handlers
<% Object.keys(requestCategories).forEach(category => { %>
import { <%= category %>Handler } from './<%= category.toLowerCase() %>-handler';
<% }); %>

/**
 * Handles MCP message processing
 */
export class MessageHandler {
  private connectionHandler: ConnectionHandler;
  private stateManager: StateManager;
  private capabilityManager: CapabilityManager;
  
  // Method handlers
  <% Object.keys(requestCategories).forEach(category => { %>
  private <%= category.toLowerCase() %>Handler: <%= category %>Handler;
  <% }); %>
  
  constructor(connectionHandler: ConnectionHandler, stateManager: StateManager) {
    this.connectionHandler = connectionHandler;
    this.stateManager = stateManager;
    this.capabilityManager = new CapabilityManager();
    
    // Initialize method handlers
    <% Object.keys(requestCategories).forEach(category => { %>
    this.<%= category.toLowerCase() %>Handler = new <%= category %>Handler(connectionHandler, stateManager);
    <% }); %>
  }
  
  /**
   * Handle an incoming message
   */
  handleMessage(message: JSONRPCMessage): void {
    logger.debug(`Received message for ${this.connectionHandler.getConnectionId()}`, { message });
    
    // Validate JSON-RPC version
    if (message.jsonrpc !== '2.0') {
      this.connectionHandler.sendErrorResponse({
        code: -32600,
        message: 'Invalid Request: Not a valid JSON-RPC 2.0 message'
      });
      return;
    }
    
    // Handle request
    if ('id' in message && 'method' in message) {
      this.handleRequest(message as JSONRPCRequest);
    }
    // Handle notification
    else if ('method' in message && !('id' in message)) {
      this.handleNotification(message as JSONRPCNotification);
    }
    // Invalid message
    else {
      this.connectionHandler.sendErrorResponse({
        code: -32600,
        message: 'Invalid Request: Not a valid JSON-RPC request or notification'
      });
    }
  }
  
  /**
   * Handle a JSON-RPC request
   */
  private handleRequest(request: JSONRPCRequest): void {
    const { id, method, params } = request;
    
    // Validate method
    if (!isValidMethod(method)) {
      this.connectionHandler.sendErrorResponse({
        code: -32600,
        message: 'Invalid Request: Method must be a string'
      }, id);
      return;
    }
    
    // Check connection initialization for methods other than 'initialize'
    const connectionId = this.connectionHandler.getConnectionId();
    const connection = this.stateManager.getConnection(connectionId);
    
    if (method !== 'initialize' && (!connection || !connection.initialized)) {
      this.connectionHandler.sendErrorResponse({
        code: -32600,
        message: 'Server not initialized: Send initialize request first'
      }, id);
      return;
    }
    
    // Route request to appropriate handler
    try {
      switch (method) {
        // Initialize
        case 'initialize':
          if (connection && connection.initialized) {
            this.connectionHandler.sendErrorResponse({
              code: -32600,
              message: 'Server already initialized'
            }, id);
            return;
          }
          this.handleInitialize(request);
          break;
          
        // Ping
        case 'ping':
          this.connectionHandler.sendResponse(id, {});
          break;
          
        <% if (requestCategories.Resources) { %>
        // Resources
        case 'resources/list':
        case 'resources/templates/list':
        case 'resources/read':
        case 'resources/subscribe':
        case 'resources/unsubscribe':
          this.resourcesHandler.handleRequest(request);
          break;
        <% } %>
        
        <% if (requestCategories.Prompts) { %>
        // Prompts
        case 'prompts/list':
        case 'prompts/get':
          this.promptsHandler.handleRequest(request);
          break;
        <% } %>
        
        <% if (requestCategories.Tools) { %>
        // Tools
        case 'tools/list':
        case 'tools/call':
          this.toolsHandler.handleRequest(request);
          break;
        <% } %>
        
        <% if (requestCategories.Logging) { %>
        // Logging
        case 'logging/setLevel':
          this.loggingHandler.handleRequest(request);
          break;
        <% } %>
        
        <% if (requestCategories.Completion) { %>
        // Completion
        case 'completion/complete':
          this.completionHandler.handleRequest(request);
          break;
        <% } %>
        
        <% if (requestCategories.Roots) { %>
        // Roots
        case 'roots/list':
          this.rootsHandler.handleRequest(request);
          break;
        <% } %>
          
        // Unknown method
        default:
          this.connectionHandler.sendErrorResponse({
            code: -32601,
            message: `Method not found: ${method}`
          }, id);
          break;
      }
    } catch (error) {
      logger.error(`Error handling request: ${error}`);
      this.connectionHandler.sendErrorResponse({
        code: -32603,
        message: 'Internal error',
        data: { error: String(error) }
      }, id);
    }
  }
  
  /**
   * Handle a JSON-RPC notification
   */
  private handleNotification(notification: JSONRPCNotification): void {
    const { method, params } = notification;
    
    // Validate method
    if (!isValidMethod(method)) {
      // We cannot send an error response for a notification, so just log it
      logger.warn(`Invalid notification method: ${method}`);
      return;
    }
    
    // Check connection initialization for methods other than initialized
    const connectionId = this.connectionHandler.getConnectionId();
    const connection = this.stateManager.getConnection(connectionId);
    
    if (method !== 'notifications/initialized' && (!connection || !connection.initialized)) {
      logger.warn(`Received notification ${method} before initialization`);
      return;
    }
    
    // Route notification to appropriate handler
    try {
      switch (method) {
        // Initialized
        case 'notifications/initialized':
          logger.info(`Client initialized: ${connectionId}`);
          break;
          
        // Cancelled
        case 'notifications/cancelled':
          if (!params || !params.requestId) {
            logger.warn('Received cancelled notification without requestId');
            return;
          }
          logger.info(`Request cancelled: ${params.requestId}`);
          break;
          
        // Progress
        case 'notifications/progress':
          if (!params || !params.progressToken) {
            logger.warn('Received progress notification without progressToken');
            return;
          }
          logger.debug(`Progress update: ${params.progress}/${params.total || '?'}`);
          break;
          
        <% if (requestCategories.Resources) { %>
        // Resources
        case 'notifications/resources/list_changed':
        case 'notifications/resources/updated':
          this.resourcesHandler.handleNotification(notification);
          break;
        <% } %>
        
        <% if (requestCategories.Prompts) { %>
        // Prompts
        case 'notifications/prompts/list_changed':
          this.promptsHandler.handleNotification(notification);
          break;
        <% } %>
        
        <% if (requestCategories.Tools) { %>
        // Tools
        case 'notifications/tools/list_changed':
          this.toolsHandler.handleNotification(notification);
          break;
        <% } %>
        
        <% if (requestCategories.Roots) { %>
        // Roots
        case 'notifications/roots/list_changed':
          this.rootsHandler.handleNotification(notification);
          break;
        <% } %>
          
        // Unknown notification
        default:
          logger.warn(`Unknown notification method: ${method}`);
          break;
      }
    } catch (error) {
      logger.error(`Error handling notification: ${error}`);
      // Can't send error response for notifications
    }
  }
  
  /**
   * Handle initialize request
   */
  private handleInitialize(request: JSONRPCRequest): void {
    const { id, params } = request;
    
    if (!params || !params.protocolVersion || !params.clientInfo) {
      this.connectionHandler.sendErrorResponse({
        code: -32602,
        message: 'Invalid params: Missing required fields'
      }, id);
      return;
    }
    
    const connectionId = this.connectionHandler.getConnectionId();
    
    // Store client capabilities
    this.stateManager.updateClientCapabilities(connectionId, params.capabilities || {});
    
    // Mark as initialized
    this.stateManager.setInitialized(connectionId, true);
    
    // Send initialize response
    this.connectionHandler.sendResponse(id, {
      protocolVersion: this.capabilityManager.getProtocolVersion(),
      serverInfo: {
        name: 'axe-handle-server',
        version: '<%= config.version %>'
      },
      capabilities: this.capabilityManager.getCapabilities(),
      instructions: 'This MCP server was generated using Axe Handle. It provides access to various resources, tools, and prompts for AI-assisted applications.'
    });
    
    logger.info(`Client initialized: ${connectionId}`);
  }
    