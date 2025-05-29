
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Send, Key, Zap, Copy, Plus } from 'lucide-react';
import { optimizedOpenRouterAPI, OPTIMIZED_MODELS } from '@/utils/optimizedOpenRouter';

interface OptimizedLLMPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onInsertResponse?: (text: string) => void;
}

interface Message {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  model: string;
}

const OptimizedLLMPanel = React.memo(({ 
  isCollapsed, 
  onToggle, 
  onInsertResponse 
}: OptimizedLLMPanelProps) => {
  const [apiKey, setApiKey] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [lowTokenMode, setLowTokenMode] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = React.useState(false);
  const { toast } = useToast();

  // Load API key on mount
  React.useEffect(() => {
    const savedKey = optimizedOpenRouterAPI.getApiKey();
    setApiKey(savedKey);
    setShowApiKeyInput(!savedKey);
  }, []);

  // Load messages from cache
  React.useEffect(() => {
    const saved = localStorage.getItem('llm_conversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(Array.isArray(parsed) ? parsed.slice(-20) : []); // Keep only last 20
      } catch (error) {
        console.warn('Failed to load conversation history:', error);
      }
    }
  }, []);

  // Save messages to cache
  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('llm_conversation', JSON.stringify(messages.slice(-20)));
    }
  }, [messages]);

  const handleSendPrompt = React.useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt before sending.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "API key required",
        description: "Please set your OpenRouter API key first.",
        variant: "destructive",
      });
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);
    const currentPrompt = prompt.trim();
    setPrompt('');

    try {
      const model = lowTokenMode ? OPTIMIZED_MODELS.LOW_TOKEN : OPTIMIZED_MODELS.STANDARD;
      const response = await optimizedOpenRouterAPI.sendPrompt(currentPrompt, model);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        prompt: currentPrompt,
        response,
        timestamp: Date.now(),
        model,
      };

      setMessages(prev => [...prev.slice(-19), newMessage]); // Keep only last 20
      
      toast({
        title: "Response received",
        description: "AI response generated successfully.",
      });
    } catch (error) {
      console.error('LLM API Error:', error);
      toast({
        title: "Failed to get response",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [prompt, apiKey, lowTokenMode, toast]);

  const handleSaveApiKey = React.useCallback(() => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      optimizedOpenRouterAPI.setApiKey(apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "API key saved",
        description: "Your OpenRouter API key has been saved securely.",
      });
    } catch (error) {
      toast({
        title: "Failed to save API key",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [apiKey, toast]);

  const handleCopyResponse = React.useCallback((response: string) => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied to clipboard",
      description: "Response copied successfully.",
    });
  }, [toast]);

  const handleInsertResponse = React.useCallback((response: string) => {
    if (onInsertResponse) {
      onInsertResponse(response);
      toast({
        title: "Response inserted",
        description: "The AI response has been inserted into your document.",
      });
    }
  }, [onInsertResponse, toast]);

  const clearHistory = React.useCallback(() => {
    setMessages([]);
    optimizedOpenRouterAPI.clearCache();
    localStorage.removeItem('llm_conversation');
    toast({
      title: "History cleared",
      description: "Conversation history and cache cleared.",
    });
  }, [toast]);

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-l border-border flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={onToggle} className="mb-4">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="w-2 h-2 bg-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Mode:</span>
          <div className="flex items-center gap-2">
            <span className={!lowTokenMode ? "text-foreground" : ""}>Standard</span>
            <Switch
              checked={lowTokenMode}
              onCheckedChange={setLowTokenMode}
              className="scale-75"
            />
            <span className={lowTokenMode ? "text-foreground" : ""}>
              <Zap className="inline w-3 h-3" /> Fast
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="flex-1 h-7"
          >
            <Key className="w-3 h-3 mr-1" />
            API Key
          </Button>
          
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory} className="h-7">
              Clear
            </Button>
          )}
        </div>

        {showApiKeyInput && (
          <div className="mt-3 space-y-2">
            <Input
              type="password"
              placeholder="Enter OpenRouter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-8 text-xs"
            />
            <Button onClick={handleSaveApiKey} size="sm" className="w-full h-7">
              Save Key
            </Button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <p>No conversation yet.</p>
            <p className="text-xs mt-1">Send a prompt to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs">
                  <div className="font-medium mb-1">You:</div>
                  <div className="text-muted-foreground">{message.prompt}</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">AI:</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyResponse(message.response)}
                        className="h-5 w-5"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      {onInsertResponse && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleInsertResponse(message.response)}
                          className="h-5 w-5"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {message.response}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask the AI assistant..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            className="flex-1 min-h-[60px] resize-none text-sm"
            disabled={isLoading}
            maxLength={4000}
          />
          <Button
            onClick={handleSendPrompt}
            disabled={isLoading || !prompt.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Press Shift+Enter for new line • {prompt.length}/4000 chars
        </div>
      </div>
    </div>
  );
});

OptimizedLLMPanel.displayName = 'OptimizedLLMPanel';

export default OptimizedLLMPanel;
