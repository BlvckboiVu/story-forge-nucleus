// AIHeader.tsx
// Header for the AI Assistant panel, including collapse/expand, context toggle, and conversation actions

import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Zap, Trash2, MessageSquare } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

/**
 * AIHeader - React memoized component for the AI panel header
 * Handles collapse/expand, context mode toggle, and conversation actions
 */
const AIHeader = React.memo(() => {
  // State and store hooks for panel state, context, and conversations
  const {
    isCollapsed,
    setCollapsed,
    contextEnabled,
    setContextEnabled,
    clearConversation,
    createConversation,
    activeConversationId,
    conversations,
  } = useAIStore();
  const { toast } = useToast();

  // Get the current conversation object
  const currentConversation = React.useMemo(() => {
    return conversations.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  /**
   * Clear the current conversation and show a toast
   */
  const handleClearConversation = React.useCallback(() => {
    if (!activeConversationId) return;
    
    clearConversation(activeConversationId);
    toast({
      title: "✨ Fresh start!",
      description: "Conversation cleared. Ready for new ideas!",
    });
  }, [activeConversationId, clearConversation, toast]);

  /**
   * Start a new conversation and show a toast
   */
  const handleNewConversation = React.useCallback(() => {
    createConversation();
    toast({
      title: "🚀 New conversation",
      description: "Let's create something amazing together!",
    });
  }, [createConversation, toast]);

  return (
    <div className="p-4 border-b border-border/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-center justify-between mb-3">
        {/* Panel title and collapse/expand button */}
        <motion.h3 
          className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isCollapsed ? "AI" : "✨ Writing Assistant"}
        </motion.h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!isCollapsed)}
              className="h-8 w-8 hover:bg-white/50 dark:hover:bg-gray-800/50"
              aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCollapsed ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCollapsed ? "Expand assistant" : "Collapse assistant"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Context mode toggle and conversation actions */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {currentConversation && (
            <div className="text-xs text-muted-foreground mb-3 truncate bg-white/30 dark:bg-gray-800/30 rounded-md px-2 py-1">
              💬 {currentConversation.title}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span className="font-medium">Context Mode:</span>
            <div className="flex items-center gap-2">
              <span className={!contextEnabled ? "text-foreground font-medium" : ""}>
                Basic
              </span>
              <Switch
                checked={contextEnabled}
                onCheckedChange={setContextEnabled}
                className="scale-75"
                aria-label="Toggle context mode"
              />
              <span className={contextEnabled ? "text-foreground font-medium" : ""}>
                <Zap className="inline w-3 h-3" /> Smart
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            {/* New conversation button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-7 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Start a fresh conversation</p>
              </TooltipContent>
            </Tooltip>

            {/* Clear conversation button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearConversation}
                  className="h-7 hover:bg-red-50 dark:hover:bg-red-950/30"
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
          </div>
        </motion.div>
      )}
    </div>
  );
});

AIHeader.displayName = 'AIHeader';

export default AIHeader;
