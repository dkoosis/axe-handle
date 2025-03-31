// internal/mcp/protocol/mcp.go
package protocol

import (
	"encoding/json"

	"github.com/dkoosis/axe-handle/pkg/mcperrors"
	"github.com/sourcegraph/jsonrpc2"
)

const (
	// Latest protocol version
	LatestProtocolVersion = "2024-11-05"
)

// Implementation describes the name and version of an MCP implementation
type Implementation struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// ClientCapabilities represents capabilities that a client may support
type ClientCapabilities struct {
	Experimental map[string]interface{} `json:"experimental,omitempty"`
	Roots        *struct {
		ListChanged bool `json:"listChanged,omitempty"`
	} `json:"roots,omitempty"`
	Sampling *struct{} `json:"sampling,omitempty"`
}

// ServerCapabilities represents capabilities that a server may support
type ServerCapabilities struct {
	Experimental map[string]interface{} `json:"experimental,omitempty"`
	Logging      *struct{}              `json:"logging,omitempty"`
	Prompts      *struct {
		ListChanged bool `json:"listChanged,omitempty"`
	} `json:"prompts,omitempty"`
	Resources *struct {
		Subscribe   bool `json:"subscribe,omitempty"`
		ListChanged bool `json:"listChanged,omitempty"`
	} `json:"resources,omitempty"`
	Tools *struct {
		ListChanged bool `json:"listChanged,omitempty"`
	} `json:"tools,omitempty"`
}

// MCP request method names
const (
	MethodInitialize    = "initialize"
	MethodPing          = "ping"
	MethodToolsList     = "tools/list"
	MethodToolsCall     = "tools/call"
	MethodResourcesList = "resources/list"
	MethodResourcesRead = "resources/read"
	MethodPromptsList   = "prompts/list"
	MethodPromptsGet    = "prompts/get"
)

// MCP notification method names
const (
	NotificationInitialized          = "notifications/initialized"
	NotificationProgress             = "notifications/progress"
	NotificationResourcesUpdated     = "notifications/resources/updated"
	NotificationResourcesListChanged = "notifications/resources/list_changed"
	NotificationToolsListChanged     = "notifications/tools/list_changed"
	NotificationPromptsListChanged   = "notifications/prompts/list_changed"
	NotificationLoggingMessage       = "notifications/message"
)

// LoggingLevel defines the level of log message
type LoggingLevel string

// Logging level constants
const (
	LoggingLevelDebug     LoggingLevel = "debug"
	LoggingLevelInfo      LoggingLevel = "info"
	LoggingLevelNotice    LoggingLevel = "notice"
	LoggingLevelWarning   LoggingLevel = "warning"
	LoggingLevelError     LoggingLevel = "error"
	LoggingLevelCritical  LoggingLevel = "critical"
	LoggingLevelAlert     LoggingLevel = "alert"
	LoggingLevelEmergency LoggingLevel = "emergency"
)

// LoggingMessageParams represents parameters for a logging message notification
type LoggingMessageParams struct {
	Level  LoggingLevel `json:"level"`
	Logger string       `json:"logger,omitempty"`
	Data   interface{}  `json:"data"`
}

// InitializeParams defines parameters for the initialize request
type InitializeParams struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ClientCapabilities `json:"capabilities"`
	ClientInfo      Implementation     `json:"clientInfo"`
}

// InitializeResult is the server's response to an initialize request
type InitializeResult struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ServerCapabilities `json:"capabilities"`
	ServerInfo      Implementation     `json:"serverInfo"`
	Instructions    string             `json:"instructions,omitempty"`
}

// Content represents a piece of content for a tool result
type Content struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

// ToolsCallResult represents the result of a tool call
type ToolsCallResult struct {
	Content []Content `json:"content"`
	IsError bool      `json:"isError,omitempty"`
}

// Tool represents a tool definition
type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description,omitempty"`
	InputSchema interface{} `json:"inputSchema"`
}

// ErrorConverter converts Go errors to jsonrpc2.Error objects
func ErrorConverter(err error) *jsonrpc2.Error {
	if err == nil {
		return nil
	}

	rpcErr := mcperrors.FromError(err)

	// Don't try to use data directly in the jsonrpc2.Error struct
	// as it expects different types than what we might have
	var jsonData json.RawMessage
	if rpcErr.Data != nil {
		// Convert to JSON first
		if raw, err := json.Marshal(rpcErr.Data); err == nil {
			jsonData = raw
		}
	}

	return &jsonrpc2.Error{
		Code:    int64(rpcErr.Code),
		Message: rpcErr.Message,
		Data:    jsonData,
	}
}
