// internal/mcp/prompts/errors.go
package prompts

import "errors"

var (
	// ErrPromptNotFound is returned when a requested prompt cannot be found
	ErrPromptNotFound = errors.New("prompt not found")
)
