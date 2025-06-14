
export function compressContent(content: string): string {
  // Simple compression - could be enhanced with actual compression library
  return content;
}

export function decompressContent(compressed: string): string {
  return compressed;
}

export function calculateContentDiff(oldContent: string, newContent: string): any {
  // Simplified diff calculation
  return {
    added: newContent.length - oldContent.length,
    removed: oldContent.length > newContent.length ? oldContent.length - newContent.length : 0,
  };
}
