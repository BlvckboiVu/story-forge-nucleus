import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FileText, CheckCircle2, XCircle } from 'lucide-react';

interface MigrationResult {
  id: string;
  title: string;
  status: 'success' | 'error';
  error?: string;
}

interface MigrationProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => Promise<void>;
  results: MigrationResult[];
  progress: number;
  isMigrating: boolean;
  className?: string;
}

export function MigrationProgress({
  isOpen,
  onClose,
  onStart,
  results,
  progress,
  isMigrating,
  className,
}: MigrationProgressProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Migration Progress</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Progress
              </span>
              <span className="text-sm font-medium">
                {progress}%
              </span>
            </div>
            
            <Progress value={progress} />
          </div>
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{result.title}</span>
                    </div>
                    
                    {result.error && (
                      <p className="text-sm text-red-500">
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isMigrating}
            >
              Cancel
            </Button>
            
            <Button
              onClick={onStart}
              disabled={isMigrating}
            >
              {isMigrating ? 'Migrating...' : 'Start Migration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 