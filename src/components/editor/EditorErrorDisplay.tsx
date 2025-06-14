
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorErrorDisplayProps {
  editorError: string;
  validationErrors: string[];
  isRecovering: boolean;
  onRecovery: () => void;
  onReload: () => void;
}

export function EditorErrorDisplay({
  editorError,
  validationErrors,
  isRecovering,
  onRecovery,
  onReload,
}: EditorErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-red-500 mb-4">
        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Editor Error</h3>
        <p className="text-sm mb-4">{editorError}</p>
        {validationErrors.length > 0 && (
          <div className="text-xs text-left bg-red-50 p-2 rounded mb-4">
            <strong>Validation Errors:</strong>
            <ul className="list-disc list-inside mt-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onRecovery}
          disabled={isRecovering}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
          Recover Content
        </Button>
        <Button onClick={onReload} variant="outline">
          Reload Editor
        </Button>
      </div>
    </div>
  );
}
