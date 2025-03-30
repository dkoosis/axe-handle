// internal/protocol/mcp.go
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

// ErrorConverter converts Go errors to jsonrpc2.Error objects
func ErrorConverter(err error) *jsonrpc2.Error {
	if err == nil {
		return nil
	}

	rpcErr := mcperrors.FromError(err)

	var data json.RawMessage
	if rpcErr.Data != nil {
		if jsonData, err := json.Marshal(rpcErr.Data); err == nil {
			data = jsonData
		}
	}

	return &jsonrpc2.Error{
		Code:    int64(rpcErr.Code),
		Message: rpcErr.Message,
		Data:    data,
	}
}
