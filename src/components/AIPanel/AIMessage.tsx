import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AIMessage as AIMessageType } from '@/stores/aiStore';

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
        title: "Copied",
        description: "Message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  }, [message.content, toast]);

  const handleInsert = React.useCallback(() => {
    if (onInsert) {
      onInsert(message.content);
      toast({
        title: "Inserted",
        description: "Message inserted into document",
      });
    }
  }, [message.content, onInsert, toast]);

  return (
    <div className="py-2 animate-in fade-in slide-in-from-bottom-2">
      {/* User Message */}
      {message.role === 'user' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg mb-2">
          <div className="font-medium text-sm mb-1">You:</div>
          <div className="text-sm text-muted-foreground">
            {message.content}
          </div>
        </div>
      )}

      {/* Assistant Message */}
      {message.role === 'assistant' && (
        <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">AI:</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
                aria-label="Copy message"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {onInsert && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleInsert}
                  aria-label="Insert message"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div className={cn(
            "text-sm text-muted-foreground whitespace-pre-wrap",
            message.tokens && "opacity-90"
          )}>
            {message.content}
          </div>
          {message.tokens && (
            <div className="text-xs text-muted-foreground mt-1 opacity-70">
              {message.tokens} tokens • {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

AIMessage.displayName = 'AIMessage';

export default AIMessage; 