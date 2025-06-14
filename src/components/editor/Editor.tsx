import { useEffect, useRef, useState } from 'react';
import { Draft } from '@/lib/db';
import { DocumentVersion } from '@/lib/versioning';
import { useEditor } from '@/hooks/useEditor';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { VersionHistory } from './VersionHistory';
import { StoryBiblePanel } from './StoryBiblePanel';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { cn } from '@/lib/utils';
import { createDocumentVersion } from '@/utils/versioning';
import { highlightStoryBibleMatches, removeStoryBibleHighlights } from '@/utils/highlights';
import { createKeyboardShortcuts, EDITOR_SHORTCUTS } from '@/utils/keyboard';

interface StoryBibleEntry {
  id: string;
  title: string;
  content: string;
  type: string;
}

interface EditorProps {
  initialContent?: string;
  draft?: Draft;
  versions?: DocumentVersion[];
  storyBibleEntries?: StoryBibleEntry[];
  onSave?: (content: string) => Promise<void>;
  onWordCountChange?: (count: number) => void;
  onStoryBibleHighlight?: (text: string) => void;
  autoSaveInterval?: number;
  wordLimit?: number;
  className?: string;
}

export function Editor({
  initialContent = '',
  draft,
  versions = [],
  storyBibleEntries = [],
  onSave,
  onWordCountChange,
  onStoryBibleHighlight,
  autoSaveInterval,
  wordLimit,
  className,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>();
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);
  const [selectedStoryBibleEntry, setSelectedStoryBibleEntry] = useState<StoryBibleEntry | null>(null);
  
  const {
    content,
    setContent,
    isDirty,
    wordCount,
    selectedFont,
    setSelectedFont,
    viewMode,
    setViewMode,
    isMobile,
    handleSave,
    handleKeyDown,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleSelectionChange,
  } = useEditor({
    initialContent,
    draft,
    onSave: async (content) => {
      setIsSaving(true);
      try {
        await onSave?.(content);
        
        if (draft) {
          const version = await createDocumentVersion(draft, content, {
            font: selectedFont,
            viewMode,
            wordCount,
            timestamp: new Date(),
          });
          
          setCurrentVersion(version);
        }
        
        setLastSaved(new Date());
      } finally {
        setIsSaving(false);
      }
    },
    onWordCountChange,
    onStoryBibleHighlight,
    autoSaveInterval,
    wordLimit,
  });
  
  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);
  
  // Set initial version
  useEffect(() => {
    if (versions.length > 0 && !currentVersion) {
      setCurrentVersion(versions[0]);
    }
  }, [versions, currentVersion]);
  
  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };
  
  // Handle version restore
  const handleVersionRestore = (version: DocumentVersion) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content;
      setContent(version.content);
      setCurrentVersion(version);
    }
  };
  
  // Handle story bible selection
  const handleStoryBibleSelect = (entry: StoryBibleEntry | null) => {
    setSelectedStoryBibleEntry(entry);
    
    if (editorRef.current) {
      if (entry) {
        highlightStoryBibleMatches(editorRef.current, [entry]);
      } else {
        removeStoryBibleHighlights(editorRef.current);
      }
    }
  };
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const shortcuts = createKeyboardShortcuts([
      ...EDITOR_SHORTCUTS,
      {
        key: 'f',
        ctrlKey: true,
        action: () => setViewMode(viewMode === 'focus' ? 'normal' : 'focus'),
      },
      {
        key: 'p',
        ctrlKey: true,
        action: () => setViewMode(viewMode === 'page' ? 'normal' : 'page'),
      },
    ]);
    
    document.addEventListener('keydown', shortcuts);
    return () => document.removeEventListener('keydown', shortcuts);
  }, [viewMode, setViewMode]);
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <EditorToolbar
        selectedFont={selectedFont}
        onFontChange={setSelectedFont}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onFormat={() => {}}
        isMobile={isMobile}
      >
        {currentVersion && (
          <VersionHistory
            versions={versions}
            currentVersion={currentVersion}
            onVersionSelect={handleVersionRestore}
          />
        )}
        
        <StoryBiblePanel
          entries={storyBibleEntries}
          selectedEntry={selectedStoryBibleEntry}
          onEntrySelect={handleStoryBibleSelect}
        />
        
        <KeyboardShortcuts />
      </EditorToolbar>
      
      <div
        ref={editorRef}
        className={cn(
          'editor-core flex-1 overflow-y-auto',
          viewMode === 'focus' && 'focus-mode',
          viewMode === 'page' && 'page-view',
          isMobile && 'mobile-editor'
        )}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        style={{ fontFamily: selectedFont }}
        data-placeholder="Start writing..."
      />
      
      <EditorStatusBar
        wordCount={wordCount}
        isDirty={isDirty}
        isSaving={isSaving}
        lastSaved={lastSaved}
        isMobile={isMobile}
      />
    </div>
  );
} 