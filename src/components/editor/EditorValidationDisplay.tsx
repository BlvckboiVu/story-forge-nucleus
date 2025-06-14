
import { AlertTriangle } from 'lucide-react';

interface EditorValidationDisplayProps {
  validationErrors: string[];
  validationWarnings: string[];
}

export function EditorValidationDisplay({ 
  validationErrors, 
  validationWarnings 
}: EditorValidationDisplayProps) {
  if (validationWarnings.length > 0) {
    return (
      <div className="flex-shrink-0 bg-yellow-50 border-l-4 border-yellow-400 p-2">
        <div className="flex">
          <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-700">
            <strong>Warning:</strong> {validationWarnings[0]}
          </div>
        </div>
      </div>
    );
  }

  if (validationErrors.length > 0) {
    return (
      <div className="text-xs text-left bg-red-50 p-2 rounded mb-4">
        <strong>Validation Errors:</strong>
        <ul className="list-disc list-inside mt-1">
          {validationErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}
