// internal/server/server.go
package server

import (
	"context"
	"log/slog"
	"sync"

	"github.com/dkoosis/axe-handle/internal/handlers"
	"github.com/yourusername/axe-handle/internal/config"
	"github.com/yourusername/axe-handle/internal/protocol"
	"github.com/yourusername/axe-handle/pkg/mcperrors"
)

// Add to internal/server/server.go

type Server struct {
	config             *config.Config
	capabilities       protocol.ServerCapabilities
	clientCapabilities protocol.ClientCapabilities
	initialized        bool
	toolsManager       *handlers.ToolsManager
	mu                 sync.RWMutex
}

// NewServer creates a new MCP server
func NewServer(cfg *config.Config) *Server {
	return &Server{
		config:       cfg,
		toolsManager: handlers.NewToolsManager(),
		capabilities: protocol.ServerCapabilities{
			// ... existing capabilities ...
		},
	}
}

// RegisterTool registers a tool with the server
func (s *Server) RegisterTool(tool protocol.Tool, handler handlers.ToolHandler) {
	s.toolsManager.RegisterTool(tool, handler)
}

// NewServer creates a new MCP server
func NewServer(cfg *config.Config) *Server {
	return &Server{
		config: cfg,
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

// Initialized handles the initialized notification
func (s *Server) Initialized(ctx context.Context) error {
	s.mu.RLock()
	initialized := s.initialized
	s.mu.RUnlock()

	if !initialized {
		return mcperrors.NewInvalidRequestError("Server not initialized")
	}

	// Log successful initialization
	slog.Info("Server fully initialized")
	return nil
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
