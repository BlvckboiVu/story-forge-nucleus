import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Key, 
  Zap, 
  History, 
  Trash2, 
  Copy,
  Plus
} from 'lucide-react';
import { openRouterAPI, MODELS } from '@/utils/openrouter';
import { cn } from '@/lib/utils';

interface LLMPanelProps {
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

const LLMPanel = ({ isCollapsed, onToggle, onInsertResponse }: LLMPanelProps) => {
  const [apiKey, setApiKey] = useState(openRouterAPI.getApiKey());
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lowTokenMode, setLowTokenMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load conversation history from localStorage
    const saved = localStorage.getItem('llm_conversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch (error) {
        console.warn('Failed to load conversation history:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save conversation history
    localStorage.setItem('llm_conversation', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendPrompt = async () => {
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
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const model = lowTokenMode ? MODELS.LOW_TOKEN : MODELS.STANDARD;
      const response = await openRouterAPI.sendPrompt(currentPrompt, model);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        prompt: currentPrompt,
        response,
        timestamp: Date.now(),
        model,
      };

      setMessages(prev => [...prev, newMessage]);
      
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
  };

  const handleSaveApiKey = () => {
    openRouterAPI.setApiKey(apiKey);
    setShowApiKeyInput(false);
    toast({
      title: "API key saved",
      description: "Your OpenRouter API key has been saved locally.",
    });
  };

  const handleInsertResponse = (response: string) => {
    if (onInsertResponse) {
      onInsertResponse(response);
      toast({
        title: "Response inserted",
        description: "The AI response has been inserted into your document.",
      });
    }
  };

  const handleCopyResponse = (response: string) => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied to clipboard",
      description: "Response copied successfully.",
    });
  };

  const clearHistory = () => {
    setMessages([]);
    openRouterAPI.clearCache();
    toast({
      title: "History cleared",
      description: "Conversation history and cache cleared.",
    });
  };

  const cacheStats = openRouterAPI.getCacheStats();

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-background border-l border-border flex flex-col items-center py-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Expand AI Panel</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 h-2 bg-primary rounded-full" />
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>AI Assistant</p>
            </TooltipContent>
          </Tooltip>
          
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-1 h-6 bg-green-500 rounded-full opacity-60" />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{messages.length} messages</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Mode:</span>
          <div className="flex items-center gap-2">
            <span className={cn(!lowTokenMode && "text-foreground")}>Standard</span>
            <Switch
              checked={lowTokenMode}
              onCheckedChange={setLowTokenMode}
              className="scale-75"
            />
            <span className={cn(lowTokenMode && "text-foreground")}>
              <Zap className="inline w-3 h-3" /> Low-Token
            </span>
          </div>
        </div>

        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="flex-1 h-7"
              >
                <Key className="w-3 h-3 mr-1" />
                API Key
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Configure OpenRouter API key</p>
            </TooltipContent>
          </Tooltip>
          
          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                  className="h-7"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear history</p>
              </TooltipContent>
            </Tooltip>
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
            <Button
              onClick={handleSaveApiKey}
              size="sm"
              className="w-full h-7"
            >
              Save Key
            </Button>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyResponse(message.response)}
                            className="h-5 w-5"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy response</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {onInsertResponse && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleInsertResponse(message.response)}
                              className="h-5 w-5"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Insert into document</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {message.response}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()} • {message.model.split('/').pop()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cache Stats */}
      {cacheStats.size > 0 && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
          Cache: {cacheStats.size}/{cacheStats.maxSize} responses
        </div>
      )}

      <Separator />

      {/* Input Area */}
      <div className="p-4">
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
          Press Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default LLMPanel;
