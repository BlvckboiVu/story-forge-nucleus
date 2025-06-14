
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, RotateCcw } from 'lucide-react';

interface RecoveryDialogProps {
  isOpen: boolean;
  onRecover: () => void;
  onDismiss: () => void;
  recoveryData?: {
    content: string;
    lastModified: number;
    wordCount: number;
  } | null;
}

export function RecoveryDialog({ isOpen, onRecover, onDismiss, recoveryData }: RecoveryDialogProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (!recoveryData) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleString();
  };

  const getPreviewText = (content: string, maxLength: number = 200) => {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-600" />
            Unsaved Changes Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              We found unsaved changes from your previous editing session. 
              Would you like to recover this content?
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last modified:</span>
                </div>
                <Badge variant="secondary">
                  {formatTime(recoveryData.lastModified)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Word count:</span>
                </div>
                <Badge variant="secondary">
                  {recoveryData.wordCount.toLocaleString()} words
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full"
              >
                {showPreview ? 'Hide' : 'Show'} Content Preview
              </Button>
              
              {showPreview && (
                <div className="bg-white dark:bg-gray-900 border rounded-md p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                    {getPreviewText(recoveryData.content)}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onDismiss}>
            Discard
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRecover} className="bg-blue-600 hover:bg-blue-700">
            Recover Content
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default RecoveryDialog;
