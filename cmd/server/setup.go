// cmd/server/setup.go
package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"runtime"
)

// ClaudeDesktopConfig represents the structure of Claude Desktop's configuration file
type ClaudeDesktopConfig struct {
	MCPServers map[string]MCPServerConfig `json:"mcpServers"`
}

// MCPServerConfig represents a server configuration in Claude Desktop
type MCPServerConfig struct {
	Command string            `json:"command"`
	Args    []string          `json:"args"`
	Env     map[string]string `json:"env,omitempty"`
}

// runSetup performs the setup process for Axe Handle.
// It configures both the local application and integrates with Claude Desktop.
//
//nolint:unused
func runSetup(configFile string) error {
	// Get executable path
	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("failed to get executable path: %w", err)
	}
	exePath, err = filepath.Abs(exePath)
	if err != nil {
		return fmt.Errorf("failed to get absolute executable path: %w", err)
	}

	slog.Info("Using executable path", "path", exePath)

	// Check and create local config
	//nolint:unused
	err = createDefaultConfig(configFile)
	if err != nil {
		return fmt.Errorf("failed to create default configuration: %w", err)
	}

	// Configure Claude Desktop
	err = configureClaudeDesktop(exePath, configFile)
	if err != nil {
		fmt.Printf("Warning: Failed to configure Claude Desktop automatically: %v\n", err)
		fmt.Println("You'll need to configure Claude Desktop manually.")
		printManualSetupInstructions(exePath, configFile)
	}

	// Print success message
	fmt.Println("✅ Axe Handle setup complete!")
	fmt.Println("Next steps:")
	fmt.Println("1. Run 'axe-handle' to start the server")
	fmt.Println("2. Open Claude Desktop to start using Axe Handle")

	return nil
}

// createDefaultConfig creates a default configuration file if none exists
//
//nolint:unused
func createDefaultConfig(configFile string) error {
	// Check if config already exists
	if _, err := os.Stat(configFile); err == nil {
		fmt.Printf("Configuration file already exists at %s\n", configFile)
		return nil
	}

	// Ensure directory exists
	configDir := filepath.Dir(configFile)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create configuration directory: %w", err)
	}

	// Create default config - using hardcoded YAML since config.Default() doesn't exist
	defaultConfig := `server:
  name: "Axe Handle"
  version: "0.1.0"
  logLevel: "info"

transport:
  type: "stdio"
  sse:
    host: "localhost"
    port: 8080
`

	fmt.Printf("Creating default configuration at %s\n", configFile)

	// Use more secure file permissions (0600 instead of 0644)
	if err := os.WriteFile(configFile, []byte(defaultConfig), 0600); err != nil {
		return fmt.Errorf("failed to write default configuration file: %w", err)
	}

	fmt.Println("Default configuration file created successfully.")
	return nil
}

// configureClaudeDesktop updates Claude Desktop's configuration to include Axe Handle
// configureClaudeDesktop updates Claude Desktop's configuration to include Axe Handle
//
//nolint:unused
func configureClaudeDesktop(exePath, configFile string) error {
	// Determine Claude Desktop config path based on OS
	claudeConfigPath := getClaudeConfigPath()

	slog.Info("Claude Desktop config path", "path", claudeConfigPath)

	// Create args for the server
	args := []string{"--config", configFile}

	// Build the server configuration
	serverConfig := MCPServerConfig{
		Command: exePath,
		Args:    args,
	}

	// Read existing Claude config if it exists
	var claudeConfig ClaudeDesktopConfig
	if _, err := os.Stat(claudeConfigPath); err == nil {
		data, err := os.ReadFile(claudeConfigPath)
		if err != nil {
			return fmt.Errorf("failed to read Claude Desktop configuration: %w", err)
		}

		if err := json.Unmarshal(data, &claudeConfig); err != nil {
			// If the file exists but is invalid, create a new one
			slog.Warn("Failed to parse existing Claude Desktop config, creating new one", "error", err)
			claudeConfig = ClaudeDesktopConfig{
				MCPServers: make(map[string]MCPServerConfig),
			}
		}
	} else {
		// Create new config if it doesn't exist
		claudeConfig = ClaudeDesktopConfig{
			MCPServers: make(map[string]MCPServerConfig),
		}
	}

	// Fix any null Args fields - ensure all existing server configs have valid Args arrays
	for name, server := range claudeConfig.MCPServers {
		if server.Args == nil {
			server.Args = []string{}
			claudeConfig.MCPServers[name] = server
			slog.Info("Fixed null Args field for server", "name", name)
		}
	}

	// Add our server to the config
	claudeConfig.MCPServers["axe-handle"] = serverConfig

	// Write the updated config
	data, err := json.MarshalIndent(claudeConfig, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal Claude Desktop configuration: %w", err)
	}

	// Ensure directory exists
	claudeConfigDir := filepath.Dir(claudeConfigPath)
	if err := os.MkdirAll(claudeConfigDir, 0755); err != nil {
		return fmt.Errorf("failed to create Claude Desktop configuration directory: %w", err)
	}

	// Use more secure file permissions (0600 instead of 0644)
	if err := os.WriteFile(claudeConfigPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write Claude Desktop configuration: %w", err)
	}

	fmt.Printf("Successfully configured Claude Desktop at %s\n", claudeConfigPath)
	return nil
}

// getClaudeConfigPath returns the path to Claude Desktop's configuration file based on the OS
//
//nolint:unused
func getClaudeConfigPath() string {
	var configDir string

	switch runtime.GOOS {
	case "darwin":
		homeDir, _ := os.UserHomeDir()
		configDir = filepath.Join(homeDir, "Library", "Application Support", "Claude")
	case "windows":
		configDir = filepath.Join(os.Getenv("APPDATA"), "Claude")
	default:
		homeDir, _ := os.UserHomeDir()
		configDir = filepath.Join(homeDir, ".config", "Claude")
	}

	return filepath.Join(configDir, "claude_desktop_config.json")
}

// printManualSetupInstructions prints instructions for manually configuring Claude Desktop
//
//nolint:unused
func printManualSetupInstructions(exePath, configFile string) {
	claudeConfigPath := getClaudeConfigPath()

	fmt.Println("\n==== Manual Claude Desktop Configuration ====")
	fmt.Printf("1. Create or edit the file at: %s\n", claudeConfigPath)
	fmt.Println("2. Add the following configuration:")

	configExample := fmt.Sprintf(`{
  "mcpServers": {
    "axe-handle": {
      "command": "%s",
      "args": ["--config", "%s"]
    }
  }
}`, exePath, configFile)

	fmt.Println(configExample)
	fmt.Println("3. Restart Claude Desktop to apply the changes")
	fmt.Println("==============================================")
}
