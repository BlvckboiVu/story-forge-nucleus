import { useState, useCallback, useEffect } from 'react';

export function useEditorFormatting(editorRef: React.RefObject<any>, trackUserAction: (action: string, data?: any) => void) {
  const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
  const [quillEditor, setQuillEditor] = useState<any>(null);
  const [selectedFont, setSelectedFont] = useState('Inter');

  // Check active formats from editor
  const checkFormats = useCallback(() => {
    if (!editorRef?.current?.getEditor) return;
    try {
      const quill = editorRef.current.getEditor();
      const range = quill.getSelection();
      if (!range) return;
      const format = quill.getFormat(range);
      setActiveFormats({
        bold: Boolean(format.bold),
        italic: Boolean(format.italic),
        underline: Boolean(format.underline),
        strike: Boolean(format.strike),
        code: Boolean(format.code),
        align: typeof format.align === 'string' ? format.align : 'left',
        list: typeof format.list === 'string' ? format.list : undefined,
        blockquote: Boolean(format.blockquote),
        header: typeof format.header === 'string' ? format.header : false,
      });
    } catch (error) {
      // ignore
    }
  }, [editorRef]);

  const handleFormatClick = useCallback((format: string, value?: any) => {
    try {
      const quill = editorRef.current?.getEditor();
      if (!quill) return;
      const range = quill.getSelection();
      if (!range) quill.setSelection(0, 0);
      trackUserAction('format_text', { format, value });
      switch (format) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strike':
        case 'code':
        case 'blockquote':
          quill.format(format, !quill.getFormat(range || { index: 0, length: 0 })[format]);
          break;
        case 'header':
          quill.format('header', value);
          break;
        case 'align':
          quill.format('align', value === 'left' ? false : value);
          break;
        case 'list':
          quill.format('list', value);
          break;
        default:
          break;
      }
    } catch (error) {}
  }, [editorRef, trackUserAction]);

  const handleUndo = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      quill.history.undo();
    }
  }, [editorRef]);

  const handleRedo = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      quill.history.redo();
    }
  }, [editorRef]);

  const getHistoryState = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      return {
        canUndo: quill.history.stack.undo.length > 0,
        canRedo: quill.history.stack.redo.length > 0,
      };
    }
    return { canUndo: false, canRedo: false };
  }, [editorRef]);

  // Font change logic
  const handleFontChange = useCallback((fontFamily: string) => {
    if (!fontFamily?.trim()) return;
    setSelectedFont(fontFamily);
    const quill = editorRef.current?.getEditor();
    if (quill) {
      const editor = quill.root;
      editor.style.fontFamily = fontFamily;
    }
  }, [editorRef]);

  // Setup event listeners for selection/text change
  useEffect(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill) {
      setQuillEditor(quill);
      quill.on('selection-change', checkFormats);
      quill.on('text-change', checkFormats);
      checkFormats();
      return () => {
        quill.off('selection-change', checkFormats);
        quill.off('text-change', checkFormats);
      };
    }
  }, [editorRef, checkFormats]);

  return {
    handleFormatClick,
    activeFormats,
    handleUndo,
    handleRedo,
    getHistoryState,
    setQuillEditor,
    checkFormats,
    quillEditor,
    selectedFont,
    handleFontChange,
  };
} 