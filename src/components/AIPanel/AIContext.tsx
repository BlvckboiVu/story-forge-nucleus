import React from 'react';
import { useAIStore } from '@/stores/aiStore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const AIContext = React.memo(() => {
  const { contextData, isProcessingContext } = useAIStore();
  const { recentText, storyBibleEntries, sceneSummaries, tokenCount } = contextData;

  if (isProcessingContext) {
    return (
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processing context...
        </div>
      </div>
    );
  }

  return (
    <Card className="mx-4 my-2 p-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium">Active Context</h4>
        <Badge variant="secondary" className="text-xs">
          {tokenCount} tokens
        </Badge>
      </div>

      <ScrollArea className="h-[100px]">
        <div className="space-y-2 text-xs">
          {/* Recent Text */}
          {recentText && (
            <div>
              <span className="text-muted-foreground">Current text: </span>
              <span className="text-foreground">
                {recentText.length > 100 
                  ? `${recentText.slice(0, 100)}...` 
                  : recentText}
              </span>
            </div>
          )}

          {/* Story Bible Entries */}
          {storyBibleEntries.length > 0 && (
            <div>
              <span className="text-muted-foreground">Story Bible: </span>
              <span className="text-foreground">
                {storyBibleEntries.map(entry => entry.name).join(', ')}
              </span>
            </div>
          )}

          {/* Scene Summaries */}
          {sceneSummaries.length > 0 && (
            <div>
              <span className="text-muted-foreground">Scene summaries: </span>
              <span className="text-foreground">
                {sceneSummaries.length} scenes included
              </span>
            </div>
          )}

          {/* Warning if approaching token limit */}
          {tokenCount > 3500 && (
            <div className="text-yellow-600 dark:text-yellow-400">
              Approaching context limit. Some content may be truncated.
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
});

AIContext.displayName = 'AIContext';

export default AIContext; 