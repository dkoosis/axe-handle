// cmd/server/main.go
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/dkoosis/axe-handle/internal/config"
	"github.com/dkoosis/axe-handle/internal/mcp/server"
	"github.com/dkoosis/axe-handle/internal/mcp/server/jsonrpc"
	"github.com/dkoosis/axe-handle/internal/transport"
	"github.com/dkoosis/axe-handle/pkg/logging"
)

func main() {
	// Check if we have a subcommand
	if len(os.Args) > 1 && os.Args[1] == "setup" {
		// Process setup command
		setupCmd := flag.NewFlagSet("setup", flag.ExitOnError)
		// Define the flag, but ignore the value for now using '_' since runSetup is commented out
		_ = setupCmd.String("config", getDefaultConfigPath(), "Path to configuration file") // <-- Fix 1: Use _

		if err := setupCmd.Parse(os.Args[2:]); err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing setup command flags: %v\n", err)
			os.Exit(1)
		}

		// Assuming runSetup exists and is defined elsewhere
		// configPathVal := *configPath // If you were using it, get value like this
		// if err := runSetup(configPathVal); err != nil {
		// 	fmt.Fprintf(os.Stderr, "Setup failed: %v\n", err)
		//  os.Exit(1)
		// }

		fmt.Println("Setup command placeholder executed.") // Placeholder
		return
	}

	// Regular command (not setup)
	defaultConfigPath := getDefaultConfigPath()
	flag.String("config", defaultConfigPath, "Path to configuration file (uses AXEHANDLE_CONFIG env var if set, overrides default)")
	flag.Parse()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		// Log the config loading error and exit, similar to original logic
		fmt.Fprintf(os.Stderr, "ERROR: Error loading configuration: %v\n", err) // <-- Fix 2: Log Error and Exit
		os.Exit(1)                                                              // <-- Fix 2: Exit on failure
	}
	// If we reach here, cfg should be non-nil and valid

	// --- Start Logging Modification ---
	// Configure logging
	// logging.Configure(logging.LogLevel(cfg.Server.LogLevel)) // <-- Original line commented out
	logging.Configure(logging.LevelDebug)               // <--- FORCE DEBUG LEVEL for this test
	slog.Debug("DEBUG LOGGING HAS BEEN FORCED ENABLED") // Add this line to confirm
	// --- End Logging Modification ---

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

// getDefaultConfigPath returns the default path for the configuration file
func getDefaultConfigPath() string {
	// Allow override via environment variable first
	if envPath := os.Getenv("AXEHANDLE_CONFIG"); envPath != "" {
		return envPath
	}
	// Fallback to default user config directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "config.yaml" // Fallback to current directory if home dir fails
	}
	return filepath.Join(homeDir, ".config", "axe-handle", "config.yaml")
}

// Placeholder for runSetup - replace with your actual implementation
// func runSetup(configPath string) error {
//   fmt.Printf("Running setup with config path: %s\n", configPath)
//   // Add actual setup logic here
//   return nil
// }

// NOTE: No DefaultConfig function assumed anymore
