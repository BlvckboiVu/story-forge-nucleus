
import { useState, useEffect, useCallback } from 'react';
import { getMCPClient, MCPClient } from '@/services/mcpClient';
import { MCPClientConfig, WritingResource, WritingTool, WritingPrompt } from '@/types/mcp';
import { useToast } from '@/hooks/use-toast';

interface MCPHookReturn {
  client: MCPClient | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  resources: WritingResource[];
  tools: WritingTool[];
  prompts: WritingPrompt[];
  connect: (config: MCPClientConfig) => Promise<void>;
  disconnect: () => void;
  refreshResources: () => Promise<void>;
  refreshTools: () => Promise<void>;
  refreshPrompts: () => Promise<void>;
  callTool: (name: string, args: any) => Promise<any>;
  getPrompt: (name: string, args?: any) => Promise<any>;
  getResource: (uri: string) => Promise<WritingResource>;
}

export function useMCP(): MCPHookReturn {
  const [client, setClient] = useState<MCPClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<WritingResource[]>([]);
  const [tools, setTools] = useState<WritingTool[]>([]);
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const { toast } = useToast();

  const connect = useCallback(async (config: MCPClientConfig) => {
    setConnecting(true);
    setError(null);
    
    try {
      const mcpClient = getMCPClient(config);
      await mcpClient.connect();
      
      setClient(mcpClient);
      setConnected(true);
      
      // Load initial data
      await Promise.all([
        refreshResourcesInternal(mcpClient),
        refreshToolsInternal(mcpClient),
        refreshPromptsInternal(mcpClient)
      ]);
      
      toast({
        title: "🔗 MCP Connected",
        description: "Successfully connected to MCP server",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: "❌ MCP Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
      setConnected(false);
      setResources([]);
      setTools([]);
      setPrompts([]);
      toast({
        title: "🔌 MCP Disconnected",
        description: "Disconnected from MCP server",
      });
    }
  }, [client, toast]);

  const refreshResourcesInternal = async (mcpClient: MCPClient) => {
    try {
      const newResources = await mcpClient.getWritingResources();
      setResources(newResources);
    } catch (err) {
      console.error('Failed to refresh resources:', err);
    }
  };

  const refreshToolsInternal = async (mcpClient: MCPClient) => {
    try {
      const newTools = await mcpClient.getAvailableTools();
      setTools(newTools);
    } catch (err) {
      console.error('Failed to refresh tools:', err);
    }
  };

  const refreshPromptsInternal = async (mcpClient: MCPClient) => {
    try {
      const newPrompts = await mcpClient.getAvailablePrompts();
      setPrompts(newPrompts);
    } catch (err) {
      console.error('Failed to refresh prompts:', err);
    }
  };

  const refreshResources = useCallback(async () => {
    if (client) {
      await refreshResourcesInternal(client);
    }
  }, [client]);

  const refreshTools = useCallback(async () => {
    if (client) {
      await refreshToolsInternal(client);
    }
  }, [client]);

  const refreshPrompts = useCallback(async () => {
    if (client) {
      await refreshPromptsInternal(client);
    }
  }, [client]);

  const callTool = useCallback(async (name: string, args: any) => {
    if (!client) {
      throw new Error('MCP client not connected');
    }
    return await client.callTool(name, args);
  }, [client]);

  const getPrompt = useCallback(async (name: string, args?: any) => {
    if (!client) {
      throw new Error('MCP client not connected');
    }
    return await client.getPrompt(name, args);
  }, [client]);

  const getResource = useCallback(async (uri: string) => {
    if (!client) {
      throw new Error('MCP client not connected');
    }
    return await client.getWritingResource(uri);
  }, [client]);

  // Update connection status when client changes
  useEffect(() => {
    if (client) {
      setConnected(client.connected);
      
      // Set up event listeners for dynamic updates
      client.on('resources/list_changed', refreshResources);
      client.on('tools/list_changed', refreshTools);
      client.on('prompts/list_changed', refreshPrompts);
      
      return () => {
        client.off('resources/list_changed', refreshResources);
        client.off('tools/list_changed', refreshTools);
        client.off('prompts/list_changed', refreshPrompts);
      };
    }
  }, [client, refreshResources, refreshTools, refreshPrompts]);

  return {
    client,
    connected,
    connecting,
    error,
    resources,
    tools,
    prompts,
    connect,
    disconnect,
    refreshResources,
    refreshTools,
    refreshPrompts,
    callTool,
    getPrompt,
    getResource,
  };
}
