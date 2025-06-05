import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useAIStore } from '@/stores/aiStore';
import { useDebounce } from '@/hooks/use-debounce';

interface AIInputProps {
  isLoading: boolean;
}

const AIInput = React.memo(({ isLoading }: AIInputProps) => {
  const { inputText, setInputText, sendMessage } = useAIStore();
  const [localInput, setLocalInput] = React.useState('');
  
  // Debounce input updates to store
  const debouncedSetInput = useDebounce(setInputText, 500);

  React.useEffect(() => {
    debouncedSetInput(localInput);
  }, [localInput, debouncedSetInput]);

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
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          value={localInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI assistant..."
          className="flex-1 min-h-[60px] max-h-[200px] resize-none text-sm"
          disabled={isLoading}
          maxLength={4000}
          aria-label="AI assistant input"
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !localInput.trim()}
          size="sm"
          className="self-end"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Shift + Enter for new line</span>
        <span>{localInput.length}/4000</span>
      </div>
    </div>
  );
});

AIInput.displayName = 'AIInput';

export default AIInput; 