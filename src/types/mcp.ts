
// MCP Protocol Type Definitions
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

// MCP Server Information
export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: MCPCapabilities;
}

export interface MCPCapabilities {
  logging?: {
    levels: string[];
  };
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
}

// Writing-specific MCP Resources
export interface WritingResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  content?: string;
}

export interface WritingTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface WritingPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// MCP Client Configuration
export interface MCPClientConfig {
  serverUrl: string;
  authToken?: string;
  timeout?: number;
  reconnectAttempts?: number;
  capabilities: MCPCapabilities;
}
