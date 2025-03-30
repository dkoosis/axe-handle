// internal/config/config.go
package config

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/knadh/koanf/parsers/json"
	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

// ServerConfig holds the server configuration
type ServerConfig struct {
	Name     string `koanf:"name"`
	Version  string `koanf:"version"`
	LogLevel string `koanf:"logLevel"`
}

// TransportConfig holds transport-related configuration
type TransportConfig struct {
	Type string `koanf:"type"` // stdio or sse
	SSE  struct {
		Port int    `koanf:"port"`
		Host string `koanf:"host"`
	} `koanf:"sse"`
}

// Config holds the complete configuration
type Config struct {
	Server    ServerConfig    `koanf:"server"`
	Transport TransportConfig `koanf:"transport"`
}

// Default configuration values
var defaultConfig = Config{
	Server: ServerConfig{
		Name:     "axe-handle",
		Version:  "0.1.0",
		LogLevel: "info",
	},
	Transport: TransportConfig{
		Type: "stdio", // Default to stdio
		SSE: struct {
			Port int    `koanf:"port"`
			Host string `koanf:"host"`
		}{
			Port: 8080,
			Host: "localhost",
		},
	},
}

// Load loads the configuration from files and environment variables
func Load() (*Config, error) {
	k := koanf.New(".")

	// Load default config
	if err := loadDefaults(k); err != nil {
		return nil, fmt.Errorf("error loading default config: %w", err)
	}

	// Load from config file
	if err := loadConfigFile(k); err != nil {
		slog.Warn("Error loading config file", "error", err)
		// Continue without config file
	}

	// Load from environment variables
	if err := loadEnv(k); err != nil {
		return nil, fmt.Errorf("error loading env vars: %w", err)
	}

	// Unmarshal the config
	var cfg Config
	if err := k.Unmarshal("", &cfg); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &cfg, nil
}

// loadDefaults loads the default configuration
func loadDefaults(k *koanf.Koanf) error {
	// Load defaults (implement marshaling to map first)
	defaults := make(map[string]interface{})
	// ... convert defaultConfig to map ...

	// Simple implementation for demonstration
	defaults["server.name"] = defaultConfig.Server.Name
	defaults["server.version"] = defaultConfig.Server.Version
	defaults["server.logLevel"] = defaultConfig.Server.LogLevel
	defaults["transport.type"] = defaultConfig.Transport.Type
	defaults["transport.sse.port"] = defaultConfig.Transport.SSE.Port
	defaults["transport.sse.host"] = defaultConfig.Transport.SSE.Host

	for k, v := range defaults {
		if err := k.Set(k, v); err != nil {
			return err
		}
	}
	return nil
}

// loadConfigFile loads configuration from a file
func loadConfigFile(k *koanf.Koanf) error {
	// Check for config file in standard locations
	configPaths := []string{
		"./config.yaml",
		"./config.json",
		filepath.Join(os.Getenv("HOME"), ".axe-handle", "config.yaml"),
		filepath.Join(os.Getenv("HOME"), ".axe-handle", "config.json"),
		"/etc/axe-handle/config.yaml",
		"/etc/axe-handle/config.json",
	}

	for _, path := range configPaths {
		if _, err := os.Stat(path); err == nil {
			var parser koanf.Parser

			if strings.HasSuffix(path, ".yaml") {
				parser = yaml.Parser()
			} else if strings.HasSuffix(path, ".json") {
				parser = json.Parser()
			} else {
				continue
			}

			if err := k.Load(file.Provider(path), parser); err == nil {
				slog.Info("Loaded config file", "path", path)
				return nil
			}
		}
	}

	return fmt.Errorf("no config file found")
}

// loadEnv loads configuration from environment variables
func loadEnv(k *koanf.Koanf) error {
	return k.Load(env.Provider("AXE_", ".", func(s string) string {
		return strings.Replace(strings.ToLower(
			strings.TrimPrefix(s, "AXE_")), "_", ".", -1)
	}), nil)
}
