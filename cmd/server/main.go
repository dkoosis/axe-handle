// cmd/server/main.go
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/dkoosis/axe-handle/internal/config"
	"github.com/dkoosis/axe-handle/internal/mcp/server"
	"github.com/dkoosis/axe-handle/internal/mcp/server/jsonrpc"
	"github.com/dkoosis/axe-handle/internal/transport"
	"github.com/dkoosis/axe-handle/pkg/logging"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading configuration: %v\n", err)
		os.Exit(1)
	}

	// Configure logging
	logging.Configure(logging.LogLevel(cfg.Server.LogLevel))

	// Create server
	mcp := server.NewServer(cfg)

	// Create handler
	handler := jsonrpc.NewHandler(mcp)

	// Create transport based on configuration
	var t transport.Transport
	if cfg.Transport.Type == "stdio" {
		t = transport.NewStdioTransport()
		slog.Info("Using stdio transport")
	} else if cfg.Transport.Type == "sse" {
		t = transport.NewSSETransport(cfg.Transport.SSE.Host, cfg.Transport.SSE.Port)
		slog.Info("Using SSE transport",
			"host", cfg.Transport.SSE.Host,
			"port", cfg.Transport.SSE.Port)
	} else {
		slog.Error("Unsupported transport type", "type", cfg.Transport.Type)
		os.Exit(1)
	}

	// Connect transport
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	_, err = t.Connect(ctx, handler)
	if err != nil {
		slog.Error("Error connecting transport", "error", err)
		os.Exit(1)
	}

	slog.Info("Axe Handle server started",
		"name", cfg.Server.Name,
		"version", cfg.Server.Version)

	// Wait for signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	slog.Info("Shutting down...")

	// Graceful shutdown
	if err := t.Close(); err != nil {
		slog.Error("Error closing transport", "error", err)
	}
}
