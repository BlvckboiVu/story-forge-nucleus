
import { MCPRequest, MCPResponse, MCPNotification, MCPServerInfo, MCPClientConfig, WritingResource, WritingTool, WritingPrompt } from '@/types/mcp';

export class MCPClient {
  private config: MCPClientConfig;
  private socket: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private eventListeners = new Map<string, Array<(data: any) => void>>();

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  // Connection Management
  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.config.serverUrl);
        
        this.socket.onopen = async () => {
          console.log('MCP Client connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          try {
            await this.initialize();
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onclose = () => {
          console.log('MCP Client disconnected');
          this.isConnected = false;
          this.cleanup();
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('MCP Client error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private async initialize(): Promise<MCPServerInfo> {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: this.config.capabilities,
      clientInfo: {
        name: 'StoryForge',
        version: '1.0.0',
      }
    });

    return response.result;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.id !== undefined) {
        // This is a response to a request
        this.handleResponse(message as MCPResponse);
      } else {
        // This is a notification
        this.handleNotification(message as MCPNotification);
      }
    } catch (error) {
      console.error('Error parsing MCP message:', error);
    }
  }

  private handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.id);
      
      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response);
      }
    }
  }

  private handleNotification(notification: MCPNotification): void {
    const listeners = this.eventListeners.get(notification.method) || [];
    listeners.forEach(listener => {
      try {
        listener(notification.params);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  private async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    if (!this.isConnected || !this.socket) {
      throw new Error('MCP Client not connected');
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.config.timeout || 30000);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      
      if (this.socket) {
        this.socket.send(JSON.stringify(request));
      } else {
        reject(new Error('Socket not available'));
      }
    });
  }

  // Writing-specific MCP Methods
  async getWritingResources(): Promise<WritingResource[]> {
    const response = await this.sendRequest('resources/list');
    return response.result?.resources || [];
  }

  async getWritingResource(uri: string): Promise<WritingResource> {
    const response = await this.sendRequest('resources/read', { uri });
    return response.result;
  }

  async getAvailableTools(): Promise<WritingTool[]> {
    const response = await this.sendRequest('tools/list');
    return response.result?.tools || [];
  }

  async callTool(name: string, arguments_: any): Promise<any> {
    const response = await this.sendRequest('tools/call', {
      name,
      arguments: arguments_
    });
    return response.result;
  }

  async getAvailablePrompts(): Promise<WritingPrompt[]> {
    const response = await this.sendRequest('prompts/list');
    return response.result?.prompts || [];
  }

  async getPrompt(name: string, arguments_?: any): Promise<any> {
    const response = await this.sendRequest('prompts/get', {
      name,
      arguments: arguments_
    });
    return response.result;
  }

  // Event Handling
  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Connection Management
  private cleanup(): void {
    this.pendingRequests.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingRequests.clear();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= (this.config.reconnectAttempts || 5)) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts})...`);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.cleanup();
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(config?: MCPClientConfig): MCPClient {
  if (!mcpClientInstance && config) {
    mcpClientInstance = new MCPClient(config);
  }
  
  if (!mcpClientInstance) {
    throw new Error('MCP Client not initialized. Please provide config on first call.');
  }
  
  return mcpClientInstance;
}
