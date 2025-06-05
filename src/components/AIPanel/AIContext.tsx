
import React from 'react';
import { useAIStore } from '@/stores/aiStore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, FileText, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const AIContext = React.memo(() => {
  const { contextData, isProcessingContext } = useAIStore();
  const { recentText, storyBibleEntries, sceneSummaries, tokenCount } = contextData;

  if (isProcessingContext) {
    return (
      <motion.div 
        className="p-4 border-b border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          🧠 Processing context...
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-2"
    >
      <Card className="p-3 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200/50 dark:border-green-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h4 className="text-xs font-medium text-green-700 dark:text-green-300">Smart Context Active</h4>
          </div>
          <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            🔢 {tokenCount} tokens
          </Badge>
        </div>

        <ScrollArea className="h-[80px]">
          <div className="space-y-2 text-xs">
            {/* Recent Text */}
            {recentText && (
              <div className="flex items-start gap-2">
                <FileText className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-muted-foreground">Current text: </span>
                  <span className="text-foreground">
                    {recentText.length > 80 
                      ? `${recentText.slice(0, 80)}...` 
                      : recentText}
                  </span>
                </div>
              </div>
            )}

            {/* Story Bible Entries */}
            {storyBibleEntries.length > 0 && (
              <div className="flex items-start gap-2">
                <BookOpen className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-muted-foreground">Story Bible: </span>
                  <span className="text-foreground">
                    {storyBibleEntries.map(entry => entry.name).join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Scene Summaries */}
            {sceneSummaries.length > 0 && (
              <div className="flex items-start gap-2">
                <FileText className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-muted-foreground">Scenes: </span>
                  <span className="text-foreground">
                    📚 {sceneSummaries.length} summaries included
                  </span>
                </div>
              </div>
            )}

            {/* Warning if approaching token limit */}
            {tokenCount > 3500 && (
              <div className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Approaching context limit. Some content may be truncated.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
});

AIContext.displayName = 'AIContext';

export default AIContext;
