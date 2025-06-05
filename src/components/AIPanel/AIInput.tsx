
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { motion } from 'framer-motion';

interface AIInputProps {
  isLoading: boolean;
}

const AIInput = React.memo(({ isLoading }: AIInputProps) => {
  const { sendMessage } = useAIStore();
  const [localInput, setLocalInput] = React.useState('');

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInput(e.target.value);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (!localInput.trim() || isLoading) return;
    
    try {
      await sendMessage(localInput);
      setLocalInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [localInput, isLoading, sendMessage]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-2">
        <Textarea
          value={localInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your story... 💭"
          className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm border-border/50 focus:border-blue-300 dark:focus:border-blue-600 transition-colors"
          disabled={isLoading}
          maxLength={2000}
          aria-label="AI assistant input"
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !localInput.trim()}
          size="sm"
          className="self-end bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>✨ Shift + Enter for new line</span>
        <span className={localInput.length > 1800 ? "text-orange-500" : ""}>
          {localInput.length}/2000
        </span>
      </div>
    </motion.div>
  );
});

AIInput.displayName = 'AIInput';

export default AIInput;
