// pkg/logging/logger.go
package logging

import (
	"context"
	"log/slog"
	"os"
)

// LogLevel represents logging levels
type LogLevel string

const (
	// Log levels
	LevelDebug LogLevel = "debug"
	LevelInfo  LogLevel = "info"
	LevelWarn  LogLevel = "warn"
	LevelError LogLevel = "error"
)

// Configure sets up the global logger with JSON format and the specified level
func Configure(level LogLevel) {
	var logLevel slog.Level

	switch level {
	case LevelDebug:
		logLevel = slog.LevelDebug
	case LevelInfo:
		logLevel = slog.LevelInfo
	case LevelWarn:
		logLevel = slog.LevelWarn
	case LevelError:
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: logLevel,
	}

	handler := slog.NewJSONHandler(os.Stderr, opts)
	logger := slog.New(handler)
	slog.SetDefault(logger)
}

// WithContext adds context values to the logger
func WithContext(ctx context.Context) *slog.Logger {
	return slog.Default().WithContext(ctx)
}
