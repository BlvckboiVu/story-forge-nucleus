import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Zap, Key, Trash2 } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AIHeader = React.memo(() => {
  const {
    isCollapsed,
    setCollapsed,
    contextEnabled,
    setContextEnabled,
    clearConversation,
    activeConversationId,
    conversations,
  } = useAIStore();
  const { toast } = useToast();

  const currentConversation = React.useMemo(() => {
    return conversations.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const handleClearConversation = React.useCallback(() => {
    if (!activeConversationId) return;
    
    clearConversation(activeConversationId);
    toast({
      title: "Conversation cleared",
      description: "All messages have been removed",
    });
  }, [activeConversationId, clearConversation, toast]);

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">AI Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!isCollapsed)}
          className="h-8 w-8"
          aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {currentConversation && (
            <div className="text-xs text-muted-foreground mb-2 truncate">
              {currentConversation.title}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Context Mode:</span>
            <div className="flex items-center gap-2">
              <span className={!contextEnabled ? "text-foreground" : ""}>
                Basic
              </span>
              <Switch
                checked={contextEnabled}
                onCheckedChange={setContextEnabled}
                className="scale-75"
                aria-label="Toggle context mode"
              />
              <span className={contextEnabled ? "text-foreground" : ""}>
                <Zap className="inline w-3 h-3" /> Smart
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearConversation}
                  className="h-7"
                  disabled={!currentConversation?.messages.length}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear conversation history</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    // Open API key settings
                  }}
                >
                  <Key className="w-3 h-3 mr-1" />
                  API Key
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure OpenRouter API key</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
});

AIHeader.displayName = 'AIHeader';

export default AIHeader; 