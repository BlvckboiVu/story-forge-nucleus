
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Plus, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AIMessage as AIMessageType } from '@/stores/aiStore';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface AIMessageProps {
  message: AIMessageType;
  onInsert?: (text: string) => void;
}

const AIMessage = React.memo(({ message, onInsert }: AIMessageProps) => {
  const { toast } = useToast();

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast({
        title: "📋 Copied!",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "❌ Copy failed",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  }, [message.content, toast]);

  const handleInsert = React.useCallback(() => {
    if (onInsert) {
      onInsert(message.content);
      toast({
        title: "✨ Inserted!",
        description: "Added to your document",
      });
    }
  }, [message.content, onInsert, toast]);

  return (
    <motion.div 
      className="py-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* User Message */}
      {message.role === 'user' && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-3 rounded-lg mb-2 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-sm text-blue-700 dark:text-blue-300">You</span>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            {message.content}
          </div>
        </div>
      )}

      {/* Assistant Message */}
      {message.role === 'assistant' && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/30 p-3 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-sm text-purple-700 dark:text-purple-300">Assistant</span>
            </div>
            <TooltipProvider>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
                      onClick={handleCopy}
                      aria-label="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>
                {onInsert && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-white/50 dark:hover:bg-gray-800/50"
                        onClick={handleInsert}
                        aria-label="Insert into document"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert into document</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
          <div className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
          {message.tokens && (
            <div className="text-xs text-muted-foreground mt-2 opacity-70 flex items-center justify-between">
              <span>🔢 {message.tokens} tokens</span>
              <span>🕐 {new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});

AIMessage.displayName = 'AIMessage';

export default AIMessage;
