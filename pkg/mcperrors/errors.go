// pkg/mcperrors/errors.go
package mcperrors

import (
	"github.com/cockroachdb/errors"
)

// JSON-RPC 2.0 error codes as defined in the MCP specification
const (
	ParseError     = -32700 // Error parsing JSON text
	InvalidRequest = -32600 // Invalid request object
	MethodNotFound = -32601 // Method not found
	InvalidParams  = -32602 // Invalid method parameters
	InternalError  = -32603 // Internal JSON-RPC error
)

// ErrorCode represents a JSON-RPC error code and message
type ErrorCode struct {
	Code    int
	Message string
}

// Standard error codes with their default messages
var (
	ErrParse          = ErrorCode{ParseError, "Parse error"}
	ErrInvalidRequest = ErrorCode{InvalidRequest, "Invalid request"}
	ErrMethodNotFound = ErrorCode{MethodNotFound, "Method not found"}
	ErrInvalidParams  = ErrorCode{InvalidParams, "Invalid params"}
	ErrInternal       = ErrorCode{InternalError, "Internal error"}
)

// RPCError represents an error that will be converted to a JSON-RPC error response
type RPCError struct {
	error
	Code    int
	Message string
	Data    interface{}
}

// Error implements the error interface for RPCError
func (e *RPCError) Error() string {
	if e.error != nil {
		return e.error.Error()
	}
	return e.Message
}

// Unwrap returns the underlying error
func (e *RPCError) Unwrap() error {
	return e.error
}

// NewError creates a new RPC error with the given code, message, and optional data
func NewError(code int, message string, data interface{}) error {
	return &RPCError{
		error:   errors.New(message),
		Code:    code,
		Message: message,
		Data:    data,
	}
}

// WithErrorCode creates an RPC error from a standard error code
func WithErrorCode(err error, ec ErrorCode, data interface{}) error {
	return &RPCError{
		error:   err,
		Code:    ec.Code,
		Message: ec.Message,
		Data:    data,
	}
}

// FromError creates an appropriate RPC error from a Go error
func FromError(err error) *RPCError {
	if err == nil {
		return nil
	}

	// Check if it's already an RPC error
	var rpcErr *RPCError
	if errors.As(err, &rpcErr) {
		return rpcErr
	}

	// Default to internal error
	return &RPCError{
		error:   err,
		Code:    InternalError,
		Message: "Internal error",
		Data:    errors.GetAllDetails(err),
	}
}

// Common helper functions for specific error types

// NewParseError creates a new parse error
func NewParseError(err error) error {
	return WithErrorCode(err, ErrParse, nil)
}

// NewInvalidRequestError creates a new invalid request error
func NewInvalidRequestError(err error) error {
	return WithErrorCode(err, ErrInvalidRequest, nil)
}

// NewMethodNotFoundError creates a new method not found error
func NewMethodNotFoundError(method string) error {
	return WithErrorCode(
		errors.Newf("method not found: %s", method),
		ErrMethodNotFound,
		nil,
	)
}

// NewInvalidParamsError creates a new invalid params error
func NewInvalidParamsError(err error) error {
	return WithErrorCode(err, ErrInvalidParams, nil)
}

// NewInternalError creates a new internal error
func NewInternalError(err error) error {
	return WithErrorCode(err, ErrInternal, nil)
}
