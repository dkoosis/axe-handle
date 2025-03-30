// internal/mcp/server/server.go
package server

import (
	"context"
	"log/slog"
	"sync"

	"github.com/dkoosis/axe-handle/internal/config"
	"github.com/dkoosis/axe-handle/internal/mcp/prompts"
	"github.com/dkoosis/axe-handle/internal/mcp/protocol"
	"github.com/dkoosis/axe-handle/internal/mcp/resources"
	"github.com/dkoosis/axe-handle/internal/mcp/server/provider"
	"github.com/dkoosis/axe-handle/internal/mcp/tools"
	handlers "github.com/dkoosis/axe-handle/internal/mcp/tools/manager"
	"github.com/dkoosis/axe-handle/pkg/mcperrors"
)

// NewServer creates a new MCP server
func NewServer(cfg *config.Config) *Server {
	return &Server{
		config:           cfg,
		providerRegistry: provider.NewRegistry(),
		capabilities: protocol.ServerCapabilities{
			Logging: &struct{}{},
			Tools: &struct {
				ListChanged bool `json:"listChanged,omitempty"`
			}{
				ListChanged: true,
			},
			Resources: &struct {
				Subscribe   bool `json:"subscribe,omitempty"`
				ListChanged bool `json:"listChanged,omitempty"`
			}{
				Subscribe:   true,
				ListChanged: true,
			},
			Prompts: &struct {
				ListChanged bool `json:"listChanged,omitempty"`
			}{
				ListChanged: true,
			},
		},
	}
}

// RegisterResourceProvider registers a resource provider with the server
func (s *Server) RegisterResourceProvider(provider resources.Provider) {
	s.providerRegistry.RegisterResourceProvider(provider)
}

// RegisterToolProvider registers a tool provider with the server
func (s *Server) RegisterToolProvider(provider tools.Provider) {
	s.providerRegistry.RegisterToolProvider(provider)
}

// RegisterPromptProvider registers a prompt provider with the server
func (s *Server) RegisterPromptProvider(provider prompts.Provider) {
	s.providerRegistry.RegisterPromptProvider(provider)
}

type Server struct {
	config             *config.Config
	capabilities       protocol.ServerCapabilities
	clientCapabilities protocol.ClientCapabilities
	initialized        bool
	toolsManager       *handlers.ToolsManager
	mu                 sync.RWMutex
}

// RegisterTool registers a tool with the server
func (s *Server) RegisterTool(tool protocol.Tool, handler handlers.ToolHandler) {
	s.toolsManager.RegisterTool(tool, handler)
}

// Initialize handles the initialize request
func (s *Server) Initialize(ctx context.Context, params protocol.InitializeParams) (*protocol.InitializeResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.initialized {
		return nil, mcperrors.NewInvalidRequestError("Server already initialized")
	}

	// Store client capabilities for later use
	s.clientCapabilities = params.Capabilities

	// Log client info
	slog.Info("Client connected",
		"name", params.ClientInfo.Name,
		"version", params.ClientInfo.Version,
		"protocolVersion", params.ProtocolVersion)

	// Mark as initialized
	s.initialized = true

	// Return server info and capabilities
	return &protocol.InitializeResult{
		ProtocolVersion: protocol.LatestProtocolVersion,
		Capabilities:    s.capabilities,
		ServerInfo: protocol.Implementation{
			Name:    s.config.Server.Name,
			Version: s.config.Server.Version,
		},
		Instructions: "Axe Handle MCP Server - A reference implementation",
	}, nil
}

// checkInitialized checks if the server is initialized
func (s *Server) checkInitialized() error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.initialized {
		return mcperrors.NewInvalidRequestError("Server not initialized")
	}
	return nil
}

// Additional method implementations would go here
