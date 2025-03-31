// internal/mcp/server/server.go
package server

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/dkoosis/axe-handle/internal/config"
	"github.com/dkoosis/axe-handle/internal/mcp/prompts"
	"github.com/dkoosis/axe-handle/internal/mcp/protocol"
	"github.com/dkoosis/axe-handle/internal/mcp/resources"
	"github.com/dkoosis/axe-handle/internal/mcp/server/provider"
	"github.com/dkoosis/axe-handle/internal/mcp/tools"
	"github.com/dkoosis/axe-handle/internal/mcp/tools/manager"
	"github.com/dkoosis/axe-handle/pkg/mcperrors"
	"github.com/sourcegraph/jsonrpc2"
)

// Server represents an MCP server implementation.
type Server struct {
	config             *config.Config
	capabilities       protocol.ServerCapabilities
	clientCapabilities protocol.ClientCapabilities
	providerRegistry   *provider.Registry
	toolsManager       *manager.ToolsManager

	// Connection management
	conn            *jsonrpc2.Conn
	initialized     bool
	shutdownStarted bool

	// Context management
	ctx    context.Context
	cancel context.CancelFunc

	// Shutdown hooks
	shutdownFuncs []func()

	// Concurrency protection
	mu sync.RWMutex
}

// NewServer creates a new MCP server with the provided configuration.
func NewServer(cfg *config.Config) *Server {
	// Create base context for server lifetime
	ctx, cancel := context.WithCancel(context.Background())

	return &Server{
		config:           cfg,
		providerRegistry: provider.NewRegistry(),
		toolsManager:     manager.NewToolsManager(),
		ctx:              ctx,
		cancel:           cancel,
		shutdownFuncs:    make([]func(), 0),
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

// RegisterResourceProvider registers a resource provider with the server.
func (s *Server) RegisterResourceProvider(provider resources.Provider) {
	s.providerRegistry.RegisterResourceProvider(provider)
}

// RegisterToolProvider registers a tool provider with the server.
func (s *Server) RegisterToolProvider(provider tools.Provider) {
	s.providerRegistry.RegisterToolProvider(provider)
}

// RegisterPromptProvider registers a prompt provider with the server.
func (s *Server) RegisterPromptProvider(provider prompts.Provider) {
	s.providerRegistry.RegisterPromptProvider(provider)
}

// SetConnection sets the jsonrpc2 connection for the server.
func (s *Server) SetConnection(conn *jsonrpc2.Conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.conn = conn
}

// Initialize handles the initialize request from the client.
func (s *Server) Initialize(ctx context.Context, params protocol.InitializeParams) (*protocol.InitializeResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Prevent double initialization
	if s.initialized {
		return nil, mcperrors.NewInvalidRequestError(fmt.Errorf("server already initialized"))
	}

	// Prevent initialization after shutdown
	if s.shutdownStarted {
		return nil, mcperrors.NewInvalidRequestError(fmt.Errorf("server is shutting down"))
	}

	// Check protocol version compatibility
	if !isProtocolVersionCompatible(params.ProtocolVersion, protocol.LatestProtocolVersion) {
		return nil, mcperrors.NewInvalidRequestError(
			fmt.Errorf("incompatible protocol version: client=%s, server=%s",
				params.ProtocolVersion, protocol.LatestProtocolVersion))
	}

	// Store client capabilities for later use
	s.clientCapabilities = params.Capabilities

	// Log successful initialization
	slog.Info("Client connected and initialized",
		"client_name", params.ClientInfo.Name,
		"client_version", params.ClientInfo.Version,
		"protocol_version", params.ProtocolVersion,
		"server_name", s.config.Server.Name,
		"server_version", s.config.Server.Version)

	// Set up shutdown hook to clean up resources
	s.setupShutdownHook()

	// Mark as initialized
	s.initialized = true

	// Generate instructions based on available providers
	instructions := s.generateInstructions()

	// Return server info and capabilities
	return &protocol.InitializeResult{
		ProtocolVersion: protocol.LatestProtocolVersion,
		Capabilities:    s.capabilities,
		ServerInfo: protocol.Implementation{
			Name:    s.config.Server.Name,
			Version: s.config.Server.Version,
		},
		Instructions: instructions,
	}, nil
}

// Initialized handles the initialized notification from the client.
func (s *Server) Initialized(ctx context.Context) error {
	s.mu.RLock()
	initialized := s.initialized
	s.mu.RUnlock()

	if !initialized {
		return mcperrors.NewInvalidRequestError(fmt.Errorf("server not initialized"))
	}

	// Start any background services that should begin only after initialization
	s.startBackgroundServices()

	// Send logging notification if the client supports it
	if s.hasLoggingCapability() {
		s.sendLogMessage(ctx, "info", "Server fully initialized and ready")
	}

	return nil
}

// Shutdown initiates graceful server shutdown.
func (s *Server) Shutdown(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.shutdownStarted {
		return nil // Already shutting down
	}

	slog.Info("Server shutdown initiated")
	s.shutdownStarted = true

	// Cancel the server context to signal shutdown to all operations
	if s.cancel != nil {
		s.cancel()
	}

	// Run all registered shutdown functions
	for _, fn := range s.shutdownFuncs {
		fn()
	}

	s.initialized = false
	return nil
}

// Exit requests immediate termination of the connection.
func (s *Server) Exit() error {
	slog.Info("Server exiting")

	// Close the connection if it exists
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.conn != nil {
		return s.conn.Close()
	}

	return nil
}

// checkInitialized checks if the server is initialized and returns an error if not.
func (s *Server) checkInitialized() error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.initialized {
		return mcperrors.NewInvalidRequestError(fmt.Errorf("server not initialized"))
	}

	if s.shutdownStarted {
		return mcperrors.NewInvalidRequestError(fmt.Errorf("server is shutting down"))
	}

	return nil
}

// isProtocolVersionCompatible checks if the client's protocol version is compatible with the server's.
func isProtocolVersionCompatible(clientVersion, serverVersion string) bool {
	// For now, just check for exact match
	// In the future, we could implement more sophisticated version compatibility checking
	return clientVersion == serverVersion
}

// setupShutdownHook registers a function to be called on server shutdown.
func (s *Server) setupShutdownHook() {
	s.shutdownFuncs = append(s.shutdownFuncs, func() {
		slog.Info("Performing graceful shutdown cleanup")
		// Add any specific cleanup logic here
	})
}

// startBackgroundServices starts any background services needed by the server.
func (s *Server) startBackgroundServices() {
	// Example: Start a heartbeat service
	go s.heartbeatService()
}

// heartbeatService periodically logs server status for health monitoring.
func (s *Server) heartbeatService() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			slog.Debug("Server heartbeat",
				"status", "running",
				"uptime", time.Since(time.Now()),
			)
		}
	}
}

// sendLogMessage sends a log message to the client if logging is supported.
func (s *Server) sendLogMessage(ctx context.Context, level string, message string) {
	s.mu.RLock()
	conn := s.conn
	s.mu.RUnlock()

	if conn == nil {
		return
	}

	// Convert level string to proper LoggingLevel type
	var loggingLevel protocol.LoggingLevel
	switch level {
	case "debug":
		loggingLevel = protocol.LoggingLevelDebug
	case "info":
		loggingLevel = protocol.LoggingLevelInfo
	case "warning":
		loggingLevel = protocol.LoggingLevelWarning
	case "error":
		loggingLevel = protocol.LoggingLevelError
	default:
		loggingLevel = protocol.LoggingLevelInfo
	}

	// Create notification params
	params := protocol.LoggingMessageParams{
		Level:  loggingLevel,
		Logger: s.config.Server.Name,
		Data:   message,
	}

	// Send notification asynchronously to not block
	go func() {
		err := conn.Notify(context.Background(), protocol.NotificationLoggingMessage, params)
		if err != nil {
			slog.Error("Failed to send log message notification", "error", err)
		}
	}()
}

// hasLoggingCapability checks if the client supports the logging capability.
func (s *Server) hasLoggingCapability() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return s.initialized && s.clientCapabilities.Logging != nil
}

// generateInstructions creates instructions text based on available providers.
func (s *Server) generateInstructions() string {
	return fmt.Sprintf("Axe Handle MCP Server - A reference implementation (version %s)\n\n"+
		"This server provides access to various resources, tools, and prompts.\n"+
		"For more information, please refer to the Model Context Protocol documentation.",
		s.config.Server.Version)
}
