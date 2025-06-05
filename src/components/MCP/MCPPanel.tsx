
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useMCP } from '@/hooks/useMCP';
import { MCPClientConfig } from '@/types/mcp';
import { 
  Plug, 
  PlugZap, 
  FileText, 
  Tool, 
  MessageSquare, 
  Settings,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MCPPanel() {
  const {
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
    getResource
  } = useMCP();

  const [serverUrl, setServerUrl] = useState('ws://localhost:3001/mcp');
  const [authToken, setAuthToken] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, any>>({});

  const handleConnect = async () => {
    const config: MCPClientConfig = {
      serverUrl,
      authToken: authToken || undefined,
      timeout: 30000,
      reconnectAttempts: autoReconnect ? 5 : 0,
      capabilities: {
        logging: { levels: ['error', 'warn', 'info'] },
        prompts: { listChanged: true },
        resources: { subscribe: true, listChanged: true },
        tools: { listChanged: true }
      }
    };

    await connect(config);
  };

  const handleToolCall = async (toolName: string, args: any = {}) => {
    try {
      const result = await callTool(toolName, args);
      setToolResults(prev => ({ ...prev, [toolName]: result }));
    } catch (error) {
      console.error('Tool call failed:', error);
      setToolResults(prev => ({ 
        ...prev, 
        [toolName]: { error: error instanceof Error ? error.message : 'Unknown error' }
      }));
    }
  };

  const handleResourceSelect = async (uri: string) => {
    setSelectedResource(uri);
    try {
      const resource = await getResource(uri);
      console.log('Resource content:', resource);
    } catch (error) {
      console.error('Failed to load resource:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="w-5 h-5 text-blue-500" />
          MCP Protocol Integration
          {connected && (
            <Badge variant="default" className="bg-green-500">
              Connected
            </Badge>
          )}
          {error && (
            <Badge variant="destructive">
              Error
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection" className="flex items-center gap-1">
              <Plug className="w-4 h-4" />
              Connection
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-1">
              <Tool className="w-4 h-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Prompts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="serverUrl">MCP Server URL</Label>
                <Input
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="ws://localhost:3001/mcp"
                  disabled={connected}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authToken">Authentication Token (Optional)</Label>
                <Input
                  id="authToken"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Optional authentication token"
                  disabled={connected}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoReconnect"
                  checked={autoReconnect}
                  onCheckedChange={setAutoReconnect}
                  disabled={connected}
                />
                <Label htmlFor="autoReconnect">Auto-reconnect on disconnect</Label>
              </div>

              <div className="flex gap-2">
                {!connected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={connecting || !serverUrl}
                    className="flex items-center gap-2"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plug className="w-4 h-4" />
                    )}
                    {connecting ? 'Connecting...' : 'Connect'}
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnect} 
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Plug className="w-4 h-4" />
                    Disconnect
                  </Button>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Resources</h3>
              <Button 
                onClick={refreshResources}
                disabled={!connected}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                <AnimatePresence>
                  {resources.map((resource, index) => (
                    <motion.div
                      key={resource.uri}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedResource === resource.uri ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleResourceSelect(resource.uri)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{resource.name}</h4>
                            <p className="text-sm text-gray-600">{resource.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{resource.uri}</p>
                          </div>
                          {resource.mimeType && (
                            <Badge variant="secondary" className="text-xs">
                              {resource.mimeType}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {connected && resources.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No resources available
                  </p>
                )}
                
                {!connected && (
                  <p className="text-center text-gray-500 py-8">
                    Connect to MCP server to view resources
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Tools</h3>
              <Button 
                onClick={refreshTools}
                disabled={!connected}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {tools.map((tool, index) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-gray-600">{tool.description}</p>
                        </div>
                        <Button
                          onClick={() => handleToolCall(tool.name)}
                          disabled={!connected}
                          size="sm"
                        >
                          Run
                        </Button>
                      </div>
                      
                      {toolResults[tool.name] && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <pre>{JSON.stringify(toolResults[tool.name], null, 2)}</pre>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
                
                {connected && tools.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No tools available
                  </p>
                )}
                
                {!connected && (
                  <p className="text-center text-gray-500 py-8">
                    Connect to MCP server to view tools
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Prompts</h3>
              <Button 
                onClick={refreshPrompts}
                disabled={!connected}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {prompts.map((prompt, index) => (
                  <motion.div
                    key={prompt.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{prompt.name}</h4>
                          <p className="text-sm text-gray-600">{prompt.description}</p>
                          {prompt.arguments && prompt.arguments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Arguments:</p>
                              <ul className="text-xs text-gray-600 ml-2">
                                {prompt.arguments.map(arg => (
                                  <li key={arg.name}>
                                    • {arg.name} {arg.required && <span className="text-red-500">*</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => getPrompt(prompt.name)}
                          disabled={!connected}
                          size="sm"
                        >
                          Use
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {connected && prompts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No prompts available
                  </p>
                )}
                
                {!connected && (
                  <p className="text-center text-gray-500 py-8">
                    Connect to MCP server to view prompts
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
