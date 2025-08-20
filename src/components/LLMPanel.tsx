// LLMPanel.tsx
// AI Assistant panel for sending prompts to OpenRouter LLM and managing conversation history

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
  Plus,
  Loader2
} from 'lucide-react';
import { openRouterAPI, MODELS } from '@/utils/openrouter';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the LLMPanel component
 * @property isCollapsed - Whether the panel is collapsed
 * @property onToggle - Function to toggle panel collapse
 * @property onInsertResponse - Callback to insert AI response into the document
 * @property config - Optional configuration for the panel
 */
interface LLMPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onInsertResponse?: (text: string) => void;
  config?: {
    maxMessages?: number;
    showTooltips?: boolean;
    showCacheStats?: boolean;
    optimized?: boolean;
  };
}

/**
 * Message object representing a user prompt and AI response
 */
interface Message {
  id: string;
  prompt: string;
  response: string;
  timestamp: number;
  model: string;
}

// Default configuration for the panel
const DEFAULT_CONFIG = {
  maxMessages: 20,
  showTooltips: true,
  showCacheStats: true,
  optimized: true
};

/**
 * LLMPanel - React memoized component for the AI Assistant panel
 * Handles API key management, prompt submission, conversation history, and UI states
 */
const LLMPanel = React.memo(({ 
  isCollapsed, 
  onToggle, 
  onInsertResponse,
  config = {}
}: LLMPanelProps) => {
  // Merge default and provided config
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  // State for API key, prompt input, loading, low-token mode, and messages
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lowTokenMode, setLowTokenMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load API key and messages from local storage on mount
  useEffect(() => {
    (async () => {
      const savedKey = await openRouterAPI.getApiKey();
      setApiKey(savedKey);
      setShowApiKeyInput(!savedKey);
    })();

    const saved = localStorage.getItem('llm_conversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(Array.isArray(parsed) ? parsed.slice(-finalConfig.maxMessages) : []);
      } catch (error) {
        console.warn('Failed to load conversation history:', error);
      }
    }
  }, [finalConfig.maxMessages]);

  // Save messages to local storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('llm_conversation', JSON.stringify(messages.slice(-finalConfig.maxMessages)));
    }
  }, [messages, finalConfig.maxMessages]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * Handle sending a prompt to the LLM API
   */
  const handleSendPrompt = useCallback(async () => {
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
      const model = lowTokenMode ? MODELS.LOW_TOKEN : MODELS.STANDARD;
      const response = await openRouterAPI.sendPrompt(currentPrompt, model);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        prompt: currentPrompt,
        response,
        timestamp: Date.now(),
        model,
      };

      setMessages(prev => [...prev.slice(-(finalConfig.maxMessages - 1)), newMessage]);
      
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
  }, [prompt, apiKey, lowTokenMode, toast, finalConfig.maxMessages]);

  /**
   * Save the API key to local storage and OpenRouter API utility
   */
  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Invalid API key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      await openRouterAPI.setApiKey(apiKey);
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

  /**
   * Insert the AI response into the document using the provided callback
   */
  const handleInsertResponse = useCallback((response: string) => {
    if (onInsertResponse) {
      onInsertResponse(response);
      toast({
        title: "Response inserted",
        description: "The AI response has been inserted into your document.",
      });
    }
  }, [onInsertResponse, toast]);

  /**
   * Copy the AI response to the clipboard
   */
  const handleCopyResponse = useCallback((response: string) => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied to clipboard",
      description: "Response copied successfully.",
    });
  }, [toast]);

  /**
   * Clear conversation history and cache
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    openRouterAPI.clearCache();
    localStorage.removeItem('llm_conversation');
    toast({
      title: "History cleared",
      description: "Conversation history and cache cleared.",
    });
  }, [toast]);

  // Get cache stats from OpenRouter API utility
  const cacheStats = openRouterAPI.getCacheStats();

  /**
   * Render the collapsed version of the panel (icon only)
   */
  const renderCollapsedPanel = () => (
    <TooltipProvider>
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
    </TooltipProvider>
  );

  /**
   * Render the expanded version of the panel (full UI)
   */
  const renderExpandedPanel = () => (
    <TooltipProvider>
      <div className="w-80 h-full bg-background border-l border-border flex flex-col">
        {/* Header */}
        <motion.div 
          className="p-4 border-b border-border"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

          <AnimatePresence>
            {showApiKeyInput && (
              <motion.div 
                className="mt-3 space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="text-xs text-muted-foreground mb-2">
                  <p>Get your API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter</a></p>
                  <p>Free tier available with 10,000 requests/month</p>
                </div>
                <Input
                  type="password"
                  placeholder="Enter OpenRouter API key (sk-or-...)"
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <motion.div 
              className="text-center text-muted-foreground text-sm mt-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No conversation yet.</p>
              <p className="text-xs mt-1">Send a prompt to get started!</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <motion.div 
                  key={message.id} 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
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
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Cache Stats */}
        {finalConfig.showCacheStats && cacheStats.size > 0 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            Cache: {cacheStats.size}/{cacheStats.maxSize} responses
          </div>
        )}

        <Separator />

        {/* Input Area */}
        <motion.div 
          className="p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Press Shift+Enter for new line • {prompt.length}/4000 chars
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );

  // Render collapsed or expanded panel based on isCollapsed prop
  return isCollapsed ? renderCollapsedPanel() : renderExpandedPanel();
});

LLMPanel.displayName = 'LLMPanel';

export default LLMPanel;
