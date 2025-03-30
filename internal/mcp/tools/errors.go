// internal/mcp/tools/errors.go (updated)
package tools

import "errors"

var (
	// ErrToolNotFound is returned when a requested tool cannot be found
	ErrToolNotFound = errors.New("tool not found")

	// ErrInvalidToolArguments is returned when tool arguments are invalid
	ErrInvalidToolArguments = errors.New("invalid tool arguments")
)
