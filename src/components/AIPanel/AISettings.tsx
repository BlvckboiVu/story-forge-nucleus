
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIStore } from '@/stores/aiStore';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Key, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { motion } from 'framer-motion';

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
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadApiKey = async () => {
      try {
        const key = await getApiKey();
        setApiKeyLocal(key || '');
      } catch (error) {
        console.error('Failed to load API key:', error);
      }
    };
    loadApiKey();
  }, [getApiKey]);

  const handleSaveApiKey = React.useCallback(async () => {
    if (!apiKey.trim()) {
      toast({
        title: "❌ Invalid API key",
        description: "Please enter a valid OpenRouter API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await setApiKey(apiKey);
      toast({
        title: "🔑 API key saved!",
        description: "Your OpenRouter API key has been securely stored",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "❌ Error saving API key",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, setApiKey, toast]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 gap-2 text-xs text-muted-foreground hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 transition-all duration-200"
          >
            <Settings2 className="h-3 w-3" />
            ⚙️ Model Settings
          </Button>
        </motion.div>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Assistant Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* API Key */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              <Label htmlFor="apiKey" className="font-medium">OpenRouter API Key</Label>
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder="sk-or-..."
              className="font-mono text-sm"
            />
            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || isLoading}
              size="sm"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? "Saving..." : "🔐 Save API Key"}
            </Button>
          </motion.div>

          {/* Model Selection */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label className="font-medium">🤖 AI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta-llama/llama-3.2-3b-instruct:free">
                  🆓 Llama 3.2 3B (Free)
                </SelectItem>
                <SelectItem value="meta-llama/llama-3.2-1b-instruct:free">
                  ⚡ Llama 3.2 1B (Free, Fast)
                </SelectItem>
                <SelectItem value="google/gemma-2-9b-it:free">
                  💎 Gemma 2 9B (Free)
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Temperature */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <Label className="font-medium">🌡️ Creativity</Label>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
              aria-label="Temperature"
            />
            <p className="text-xs text-muted-foreground">
              🎨 Higher values = more creative, 🎯 lower values = more focused
            </p>
          </motion.div>

          {/* Max Tokens */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <Label className="font-medium">📏 Response Length</Label>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {maxTokens}
              </span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([value]) => setMaxTokens(value)}
              min={100}
              max={2000}
              step={100}
              className="w-full"
              aria-label="Max tokens"
            />
            <p className="text-xs text-muted-foreground">
              📝 Maximum length of AI responses
            </p>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

AISettings.displayName = 'AISettings';

export default AISettings;
