// internal/mcp/resources/errors.go
package resources

import "errors"

var (
	// ErrResourceNotFound is returned when a requested resource cannot be found
	ErrResourceNotFound = errors.New("resource not found")
)
