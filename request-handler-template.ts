// src/handlers/request-handler.ts.ejs
import { JSONRPCRequest, JSONRPCNotification<% requests.forEach(request => { %>
, <%= request.name %><% if (isResponseType(getResponseTypeForRequest(request.name))) { %>, <%= getResponseTypeForRequest(request.name) %><% } %><% }); %>
} from '../schema/mcp-schema';
import { ConnectionHandler } from './connection-handler';
import { StateManager } from '../state-manager';
import { logger } from '../utils';

/**
 * Handles <%= category %> related requests and notifications
 */
export class <%= category %>Handler {
  private connectionHandler: ConnectionHandler;
  private stateManager: StateManager;
  
  constructor(connectionHandler: ConnectionHandler, stateManager: StateManager) {
    this.connectionHandler = connectionHandler;
    this.stateManager = stateManager;
  }
  
  /**
   * Handle a request in the <%= category %> category
   */
  handleRequest(request: JSONRPCRequest): void {
    const { id, method, params } = request;
    
    switch (method) {
      <% requests.forEach(request => { %>
      case '<%= getMethodFromRequest(request.name) %>':
        this.handle<%= request.name.replace('Request', '') %>(request);
        break;
      <% }); %>
      
      default:
        this.connectionHandler.sendErrorResponse({
          code: -32601,
          message: `Method not found: ${method}`
        }, id);
        break;
    }
  }
  
  /**
   * Handle a notification in the <%= category %> category
   */
  handleNotification(notification: JSONRPCNotification): void {
    const { method, params } = notification;
    
    switch (method) {
      <% if (category === 'Resources') { %>
      case 'notifications/resources/list_changed':
        this.handleResourceListChanged(notification);
        break;
      case 'notifications/resources/updated':
        this.handleResourceUpdated(notification);
        break;
      <% } else if (category === 'Prompts') { %>
      case 'notifications/prompts/list_changed':
        this.handlePromptListChanged(notification);
        break;
      <% } else if (category === 'Tools') { %>
      case 'notifications/tools/list_changed':
        this.handleToolListChanged(notification);
        break;
      <% } else if (category === 'Roots') { %>
      case 'notifications/roots/list_changed':
        this.handleRootsListChanged(notification);
        break;
      <% } %>
      
      default:
        logger.warn(`Unknown notification method in <%= category %> category: ${method}`);
        break;
    }
  }
  
  <% requests.forEach(request => { %>
  /**
   * Handle <%= request.name.replace('Request', '') %> request
   * <%= request.description ? '\n   * ' + request.description : '' %>
   */
  private handle<%= request.name.replace('Request', '') %>(request: JSONRPCRequest): void {
    const { id, params } = request;
    
    // TODO: Implement <%= request.name.replace('Request', '') %> handling
    // This is a placeholder implementation
    
    <% if (isResponseType(getResponseTypeForRequest(request.name))) { %>
    const response: <%= getResponseTypeForRequest(request.name)['name'] %> = {
      // TODO: Add proper response properties
    };
    
    this.connectionHandler.sendResponse(id, response);
    <% } else { %>
    this.connectionHandler.sendResponse(id, {});
    <% } %>
  }
  
  <% }); %>
  
  <% if (category === 'Resources') { %>
  /**
   * Handle resource list changed notification
   */
  private handleResourceListChanged(notification: JSONRPCNotification): void {
    logger.info('Resource list changed');
    // TODO: Implement handling of resource list changes
  }
  
  /**
   * Handle resource updated notification
   */
  private handleResourceUpdated(notification: JSONRPCNotification): void {
    const { params } = notification;
    if (!params || !params.uri) {
      logger.warn('Received resource updated notification without URI');
      return;
    }
    
    logger.info(`Resource updated: ${params.uri}`);
    // TODO: Implement handling of resource updates
  }
  <% } else if (category === 'Prompts') { %>
  /**
   * Handle prompt list changed notification
   */
  private handlePromptListChanged(notification: JSONRPCNotification): void {
    logger.info('Prompt list changed');
    // TODO: Implement handling of prompt list changes
  }
  <% } else if (category === 'Tools') { %>
  /**
   * Handle tool list changed notification
   */
  private handleToolListChanged(notification: JSONRPCNotification): void {
    logger.info('Tool list changed');
    // TODO: Implement handling of tool list changes
  }
  <% } else if (category === 'Roots') { %>
  /**
   * Handle roots list changed notification
   */
  private handleRootsListChanged(notification: JSONRPCNotification): void {
    logger.info('Roots list changed');
    // TODO: Implement handling of roots list changes
  }
  <% } %>
}
