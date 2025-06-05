import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore } from '@/stores/aiStore';
import { AIHeader } from './AIHeader';
import { AIMessage } from './AIMessage';
import { AIInput } from './AIInput';
import { AIContext } from './AIContext';
import { AISettings } from './AISettings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVirtualizer } from '@tanstack/react-virtual';

interface AIPanelProps {
  onInsertResponse?: (text: string) => void;
}

const AIPanel = React.memo(({ onInsertResponse }: AIPanelProps) => {
  const {
    isCollapsed,
    messages,
    isLoading,
    contextEnabled,
    setCollapsed,
    activeConversationId,
  } = useAIStore();

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
    expanded: { width: 300, opacity: 1 },
    collapsed: { width: 50, opacity: 0.8 },
  };

  if (!activeConversationId) {
    return null;
  }

  return (
    <motion.div
      className="h-full bg-background border-l border-border flex flex-col"
      initial={isCollapsed ? "collapsed" : "expanded"}
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={variants}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <AIHeader />

      {!isCollapsed && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {contextEnabled && <AIContext />}

            {/* Messages Area */}
            <ScrollArea ref={parentRef} className="flex-1 px-4">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
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

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <AIInput isLoading={isLoading} />
            </div>

            {/* Settings Area */}
            <AISettings />
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
});

AIPanel.displayName = 'AIPanel';

export default AIPanel; 