import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIStore } from '@/stores/aiStore';
import { useToast } from '@/hooks/use-toast';
import { Settings2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const AISettings = React.memo(() => {
  const {
    selectedModel,
    temperature,
    maxTokens,
    setSelectedModel,
    setTemperature,
    setMaxTokens,
    setApiKey,
    getApiKey,
  } = useAIStore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [apiKey, setApiKeyLocal] = React.useState('');

  React.useEffect(() => {
    const loadApiKey = async () => {
      const key = await getApiKey();
      setApiKeyLocal(key || '');
    };
    loadApiKey();
  }, [getApiKey]);

  const handleSaveApiKey = React.useCallback(async () => {
    try {
      await setApiKey(apiKey);
      toast({
        title: "API key saved",
        description: "Your OpenRouter API key has been securely stored",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error saving API key",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [apiKey, setApiKey, toast]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-8 gap-2 text-xs text-muted-foreground"
        >
          <Settings2 className="h-3 w-3" />
          Model Settings
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>AI Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenRouter API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder="Enter your API key"
            />
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              size="sm"
              className="w-full"
            >
              Save API Key
            </Button>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="openai/gpt-4">GPT-4</SelectItem>
                <SelectItem value="anthropic/claude-2">Claude 2</SelectItem>
                <SelectItem value="meta-llama/llama-2-70b-chat">Llama 2 70B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-xs text-muted-foreground">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              min={0}
              max={2}
              step={0.1}
              aria-label="Temperature"
            />
            <p className="text-xs text-muted-foreground">
              Higher values make output more creative but less predictable
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Max Tokens</Label>
              <span className="text-xs text-muted-foreground">
                {maxTokens}
              </span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([value]) => setMaxTokens(value)}
              min={100}
              max={4000}
              step={100}
              aria-label="Max tokens"
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of the AI response
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

AISettings.displayName = 'AISettings';

export default AISettings; 