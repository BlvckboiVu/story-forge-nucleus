// AIPanel.tsx
// Main AI Assistant panel for chat-based interaction, context, and settings

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore } from '@/stores/aiStore';
import AIHeader from './AIHeader';
import AIMessage from './AIMessage';
import AIInput from './AIInput';
import AIContext from './AIContext';
import AISettings from './AISettings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Props for the AIPanel component
 * @property onInsertResponse - Callback to insert AI response into the document
 */
interface AIPanelProps {
  onInsertResponse?: (text: string) => void;
}

/**
 * AIPanel - React memoized component for the AI chat assistant panel
 * Handles panel collapse, context, messages, and settings
 */
const AIPanel = React.memo(({ onInsertResponse }: AIPanelProps) => {
  // State and store hooks for panel state, loading, context, and conversations
  const {
    isCollapsed,
    isLoading,
    contextEnabled,
    activeConversationId,
    conversations,
  } = useAIStore();

  // Get current conversation messages
  const currentConversation = React.useMemo(() => {
    return conversations.find(c => c.id === activeConversationId);
  }, [conversations, activeConversationId]);

  const messages = currentConversation?.messages || [];

  // Create a virtual list for messages
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  // Panel animation variants
  const variants = {
    expanded: { 
      width: 320, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    collapsed: { 
      width: 60, 
      opacity: 0.9,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
  };

  return (
    <TooltipProvider>
      {/* Animated panel container */}
      <motion.div
        className="h-full bg-gradient-to-b from-background to-muted/20 border-l border-border/50 flex flex-col shadow-lg"
        initial={isCollapsed ? "collapsed" : "expanded"}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={variants}
      >
        {/* Panel header with collapse/expand and context toggle */}
        <AIHeader />

        {/* Only show chat and settings if not collapsed */}
        {!isCollapsed && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Smart context summary if enabled */}
              {contextEnabled && <AIContext />}

              {/* Messages Area */}
              <div className="flex-1 relative">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-4"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        ✨
                      </div>
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Hey there, writer! 👋
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      I'm here to help spark your creativity. Ask me anything about your story, characters, or writing!
                    </p>
                  </div>
                ) : (
                  <ScrollArea ref={parentRef} className="h-full px-4">
                    <div
                      style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                      }}
                    >
                      {/* Virtualized message list for performance */}
                      {virtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <AIMessage
                            message={messages[virtualRow.index]}
                            onInsert={onInsertResponse}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                <AIInput isLoading={isLoading} />
              </div>

              {/* Settings Area */}
              <AISettings />
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </TooltipProvider>
  );
});

AIPanel.displayName = 'AIPanel';

export default AIPanel;
