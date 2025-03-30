# Axe Handle MCP Server Implementation Roadmap

This document outlines the implementation roadmap for the Axe Handle MCP server project. It's structured to guide development in logical phases, using a domain-focused architectural approach with a clear path for supporting RTM integration.

## Project Architecture

We'll implement a domain-focused architecture:

```
axe-handle/
├── cmd/
│   └── server/              # Application entry point
├── internal/
│   ├── mcp/                 # MCP domain - interfaces and protocol implementation
│   │   ├── resources/       # Resource interfaces and management
│   │   ├── tools/           # Tool interfaces and management
│   │   ├── prompts/         # Prompt interfaces and management
│   │   └── server/          # Protocol implementation
│   │       ├── jsonrpc/     # JSON-RPC handling
│   │       ├── lifecycle/   # Connection lifecycle management
│   │       └── transport/   # Transport implementations
│   ├── providers/           # Concrete implementations
│   │   ├── example/         # Example provider implementation
│   │   ├── filesystem/      # Filesystem provider implementation
│   │   └── rtm/            # RTM provider implementation (future)
│   └── config/              # Configuration management
├── pkg/                     # Public APIs (if needed)
└── test/                    # Integration and conformance tests
```

## Phase 1: Core MCP Domain

### Step 1: Define Core Interfaces

- [ ] Create resource provider interface
  ```go
  // internal/mcp/resources/provider.go
  type Provider interface {
      ListResources() ([]Resource, error)
      GetResource(uri string) (Resource, error)
  }
  ```

- [ ] Create tool provider interface
  ```go
  // internal/mcp/tools/provider.go
  type Provider interface {
      ListTools() ([]Tool, error)
      ExecuteTool(name string, args map[string]interface{}) (ToolResult, error)
  }
  ```

- [ ] Create prompt provider interface
  ```go
  // internal/mcp/prompts/provider.go
  type Provider interface {
      ListPrompts() ([]Prompt, error)
      GetPrompt(name string, args map[string]string) (PromptResult, error)
  }
  ```

### Step 2: Implement JSON-RPC Handling

- [ ] Define message types corresponding to MCP spec
  ```go
  // internal/mcp/server/jsonrpc/messages.go
  type Request struct {
      JSONRPC string      `json:"jsonrpc"`
      ID      interface{} `json:"id"`
      Method  string      `json:"method"`
      Params  interface{} `json:"params,omitempty"`
  }
  ```

- [ ] Implement message encoding/decoding
- [ ] Create request/response handling framework

### Step 3: Implement Transport Layer

- [ ] Create transport interface
  ```go
  // internal/mcp/server/transport/transport.go
  type Transport interface {
      Start() error
      Send(message jsonrpc.Message) error
      Close() error
      SetMessageHandler(handler MessageHandler)
  }
  
  type MessageHandler func(message jsonrpc.Message) error
  ```

- [ ] Implement stdio transport
  - [ ] Handle Content-Length headers correctly
  - [ ] Implement bidirectional communication

- [ ] Implement SSE transport
  - [ ] Handle HTTP request/response cycle
  - [ ] Implement event streaming

### Step 4: Implement Lifecycle Management

- [ ] Implement initialization protocol
- [ ] Handle capability negotiation
- [ ] Implement proper shutdown sequence

### Step 5: Create Server Orchestration

- [ ] Implement provider registry
  ```go
  // internal/mcp/server/server.go
  type Server struct {
      resourceProviders []resources.Provider
      toolProviders     []tools.Provider
      promptProviders   []prompts.Provider
      // other fields...
  }
  
  func (s *Server) RegisterResourceProvider(provider resources.Provider) {
      s.resourceProviders = append(s.resourceProviders, provider)
  }
  
  // Similar methods for tools and prompts
  ```

- [ ] Implement message routing to appropriate providers
- [ ] Handle concurrent requests properly

## Phase 2: Example Provider Implementation

### Step 1: Create Example Resource Provider

- [ ] Implement a simple resource provider
  ```go
  // internal/providers/example/resources.go
  type ResourceProvider struct {}
  
  // Ensure it implements the interface
  var _ resources.Provider = (*ResourceProvider)(nil)
  
  func (p *ResourceProvider) ListResources() ([]resources.Resource, error) {
      // Implementation...
  }
  
  func (p *ResourceProvider) GetResource(uri string) (resources.Resource, error) {
      // Implementation...
  }
  ```

### Step 2: Create Example Tool Provider

- [ ] Implement a calculator tool provider
  ```go
  // internal/providers/example/tools.go
  type ToolProvider struct {}
  
  // Ensure it implements the interface
  var _ tools.Provider = (*ToolProvider)(nil)
  
  func (p *ToolProvider) ListTools() ([]tools.Tool, error) {
      // Return a calculator tool
  }
  
  func (p *ToolProvider) ExecuteTool(name string, args map[string]interface{}) (tools.ToolResult, error) {
      // Implementation for calculator operations
  }
  ```

### Step 3: Create Example Prompt Provider

- [ ] Implement a basic prompt provider
  ```go
  // internal/providers/example/prompts.go
  type PromptProvider struct {}
  
  // Ensure it implements the interface
  var _ prompts.Provider = (*PromptProvider)(nil)
  
  func (p *PromptProvider) ListPrompts() ([]prompts.Prompt, error) {
      // Implementation...
  }
  
  func (p *PromptProvider) GetPrompt(name string, args map[string]string) (prompts.PromptResult, error) {
      // Implementation...
  }
  ```

## Phase 3: Filesystem Provider Implementation

### Step 1: Create Filesystem Resource Provider

- [ ] Implement file and directory resources
- [ ] Handle URI parsing and validation
- [ ] Implement proper file access security

### Step 2: Create Filesystem Tool Provider

- [ ] Implement file operation tools (read, write, etc.)
- [ ] Handle permissions and security

## Phase 4: RTM Provider Implementation

This phase establishes how the RTM service will integrate with our MCP server architecture.

### Step 1: Define RTM Provider Structure

- [ ] Create RTM provider package structure
  ```go
  // internal/providers/rtm/
  ├── resources.go   // RTM Resource Provider implementation
  ├── tools.go       // RTM Tool Provider implementation
  ├── prompts.go     // RTM Prompt Provider implementation
  ├── client/        // RTM API client
  │   ├── client.go  // Client implementation
  │   └── types.go   // RTM-specific types
  └── auth/          // Authentication for RTM
  ```

### Step 2: Implement RTM Resource Provider

- [ ] Create RTM API client for accessing resources
  ```go
  // internal/providers/rtm/client/client.go
  type Client struct {
      baseURL    string
      httpClient *http.Client
      authToken  string
  }
  
  func (c *Client) GetResources() ([]Resource, error) {
      // Implementation to fetch resources from RTM API
  }
  ```

- [ ] Implement resource provider interface
  ```go
  // internal/providers/rtm/resources.go
  type ResourceProvider struct {
      client *client.Client
  }
  
  // Ensure it implements the interface
  var _ resources.Provider = (*ResourceProvider)(nil)
  
  func (p *ResourceProvider) ListResources() ([]resources.Resource, error) {
      // Use RTM client to fetch and convert resources
  }
  
  func (p *ResourceProvider) GetResource(uri string) (resources.Resource, error) {
      // Parse URI to extract RTM-specific information
      // Use RTM client to fetch the specific resource
  }
  ```

### Step 3: Implement RTM Tool Provider

- [ ] Implement RTM API operations as tools
  ```go
  // internal/providers/rtm/tools.go
  type ToolProvider struct {
      client *client.Client
  }
  
  // Ensure it implements the interface
  var _ tools.Provider = (*ToolProvider)(nil)
  
  func (p *ToolProvider) ListTools() ([]tools.Tool, error) {
      // Return tools that perform RTM-specific operations
  }
  
  func (p *ToolProvider) ExecuteTool(name string, args map[string]interface{}) (tools.ToolResult, error) {
      // Execute RTM API calls based on the requested tool
  }
  ```

### Step 4: Implement RTM Authentication

- [ ] Create authentication mechanisms for RTM API
  ```go
  // internal/providers/rtm/auth/auth.go
  type Authenticator struct {
      // Authentication configuration
  }
  
  func (a *Authenticator) GetToken() (string, error) {
      // Implementation to retrieve authentication token
  }
  ```

### Step 5: Register RTM Providers with MCP Server

- [ ] Add configuration options for RTM
- [ ] Initialize and register RTM providers
  ```go
  // cmd/server/main.go
  func registerRTMProviders(server *mcp.Server, config *config.Config) error {
      rtmClient := rtm.NewClient(config.RTM.BaseURL)
      
      // Set up authentication
      authenticator := rtm.NewAuthenticator(config.RTM.AuthConfig)
      token, err := authenticator.GetToken()
      if err != nil {
          return fmt.Errorf("failed to authenticate with RTM: %w", err)
      }
      rtmClient.SetAuthToken(token)
      
      // Create and register providers
      resourceProvider := rtm.NewResourceProvider(rtmClient)
      toolProvider := rtm.NewToolProvider(rtmClient)
      
      server.RegisterResourceProvider(resourceProvider)
      server.RegisterToolProvider(toolProvider)
      
      return nil
  }
  ```

## Phase 5: Command Line Interface

### Step 1: Create Entry Point

- [ ] Implement configuration handling
- [ ] Set up provider registration
- [ ] Create clean startup/shutdown

### Step 2: Add Command Line Options

- [ ] Support selecting transport methods
- [ ] Configure authorization
- [ ] Enable/disable specific providers

## Phase 6: Testing

### Step 1: Unit Tests

- [ ] Test JSON-RPC encoding/decoding
- [ ] Test transport implementations
- [ ] Test provider implementations

### Step 2: Integration Tests

- [ ] Test end-to-end message flow
- [ ] Test provider registration and execution
- [ ] Test error handling
- [ ] Create RTM-specific integration tests
  ```go
  // test/integration/rtm_test.go
  func TestRTMResourceProvider(t *testing.T) {
      // Test RTM resource provider integration
  }
  
  func TestRTMToolProvider(t *testing.T) {
      // Test RTM tool provider integration
  }
  ```

### Step 3: Conformance Tests

- [ ] Verify spec compliance
- [ ] Test against reference MCP clients
- [ ] Create RTM-specific mock server for testing
  ```go
  // test/mocks/rtm_server.go
  type MockRTMServer struct {
      // Fields to track requests and provide canned responses
  }
  
  func NewMockRTMServer() *MockRTMServer {
      // Initialize mock server
  }
  
  func (s *MockRTMServer) Start() *httptest.Server {
      // Create HTTP test server that mimics RTM API responses
  }
  ```

## Phase 7: Documentation

### Step 1: API Documentation

- [ ] Document public interfaces
- [ ] Provide usage examples

### Step 2: Provider Implementation Guide

- [ ] Document how to create new providers
- [ ] Explain interface contracts

### Step 3: User Guide

- [ ] Document command line options
- [ ] Explain configuration

## Implementation Notes

### Error Handling

- Use Go's error wrapping: `fmt.Errorf("failed to process request: %w", err)`
- Define sentinel errors for expected error cases
- Use `errors.Is()` and `errors.As()` for error checking
- Create domain-specific error types where appropriate:
  ```go
  // internal/providers/rtm/errors.go
  var (
      ErrRTMAuthentication = errors.New("rtm: authentication failed")
      ErrRTMResourceNotFound = errors.New("rtm: resource not found")
      ErrRTMAPIError = errors.New("rtm: api error")
  )
  ```

### Concurrency

- Use contexts for cancelation and timeouts
- Protect shared state with appropriate synchronization
- Consider goroutine management patterns
- Handle provider operations concurrently where appropriate:
  ```go
  // Example of concurrent resource aggregation across providers
  func (s *Server) ListAllResources(ctx context.Context) ([]Resource, error) {
      var mu sync.Mutex
      var allResources []Resource
      
      // Create wait group for provider operations
      var wg sync.WaitGroup
      errs := make(chan error, len(s.resourceProviders))
      
      for _, provider := range s.resourceProviders {
          wg.Add(1)
          go func(p Provider) {
              defer wg.Done()
              
              resources, err := p.ListResources(ctx)
              if err != nil {
                  select {
                  case errs <- err:
                  default:
                  }
                  return
              }
              
              mu.Lock()
              allResources = append(allResources, resources...)
              mu.Unlock()
          }(provider)
      }
      
      // Wait for all operations to complete
      wg.Wait()
      
      // Check for errors
      select {
      case err := <-errs:
          return nil, err
      default:
          return allResources, nil
      }
  }
  ```

### Logging

- Implement structured logging
- Include correlation IDs for request tracing
- Log at appropriate levels (debug, info, error)
- Include domain-specific fields in log entries:
  ```go
  logger.With(
      "provider", "rtm",
      "resource_uri", uri,
      "operation", "get_resource",
  ).Info("Fetching RTM resource")
  ```

### Testing

- Use table-driven tests where appropriate
- Create test helpers for common operations
- Use interfaces to enable mocking
- Create RTM-specific testing utilities:
  ```go
  // test/helpers/rtm.go
  
  // NewMockRTMClient creates a mock RTM client for testing
  func NewMockRTMClient() *MockRTMClient {
      return &MockRTMClient{
          resources: make(map[string]Resource),
      }
  }
  
  // MockRTMClient implements the RTM client interface for testing
  type MockRTMClient struct {
      resources map[string]Resource
  }
  
  // AddResource adds a mock resource to the client
  func (m *MockRTMClient) AddResource(id string, resource Resource) {
      m.resources[id] = resource
  }
  ```

## RTM Integration Architecture

The RTM provider will implement the MCP interfaces while internally communicating with the RTM API:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      MCP Server                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌───────────────┐    ┌───────────────┐    ┌──────────┐   │
│    │  Filesystem   │    │    Example    │    │   RTM    │   │
│    │   Provider    │    │    Provider   │    │ Provider │   │
│    └───────────────┘    └───────────────┘    └──────────┘   │
│                                                  │          │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │   RTM API   │
                                            └─────────────┘
```

The RTM provider:
1. Implements MCP interfaces (Resources, Tools, Prompts)
2. Translates between MCP concepts and RTM API concepts
3. Handles authentication and communication with RTM
4. Maps RTM errors to appropriate MCP errors

This architecture allows:
- Clean separation between MCP protocol and RTM implementation
- Independent development of MCP server and RTM integration
- Easy addition of other domain providers in the future
- Clear testing boundaries

## Contribution Guidelines

- Follow Go style conventions
- Maintain clean separation between domains
- Write tests for all new functionality
- Document public APIs

This roadmap will evolve as implementation progresses, but it provides a starting framework for development with a clear path for RTM integration.