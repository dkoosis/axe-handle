// internal/mcp/resources/provider.go
package resources

// Resource represents a resource that can be accessed by clients
type Resource struct {
	URI         string
	Name        string
	Description string
	MimeType    string
}

// Provider defines the interface for resource providers
type Provider interface {
	// ListResources returns a list of available resources
	ListResources() ([]Resource, error)
	
	// GetResource returns the content of a specific resource
	GetResource(uri string) (interface{}, error)
}
