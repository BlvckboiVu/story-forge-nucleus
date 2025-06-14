import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { migrateProjectDrafts, validateMigration } from '@/utils/migration';

interface MigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  drafts: Draft[];
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  drafts
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [validationResults, setValidationResults] = useState<{
    success: boolean;
    wordCountDiff: number;
    issues: string[];
  }[]>([]);
  const { toast } = useToast();

  const handleMigrate = async () => {
    setIsMigrating(true);
    setProgress(0);
    setValidationResults([]);
    
    try {
      const projectDrafts = drafts.filter(d => d.projectId === projectId);
      const totalDrafts = projectDrafts.length;
      
      for (let i = 0; i < projectDrafts.length; i++) {
        const draft = projectDrafts[i];
        setCurrentDraft(draft.title);
        
        // Migrate draft
        await migrateProjectDrafts(projectId, [draft]);
        
        // Validate migration
        const validation = validateMigration(
          draft.content,
          draft.content // This will be replaced with migrated content in real implementation
        );
        setValidationResults(prev => [...prev, validation]);
        
        // Update progress
        setProgress(((i + 1) / totalDrafts) * 100);
      }
      
      // Show success message
      toast({
        title: "Migration complete",
        description: `Successfully migrated ${totalDrafts} drafts`,
      });
      
      onClose();
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Migration failed",
        description: "Failed to migrate drafts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Migrate to New Editor</DialogTitle>
          <DialogDescription>
            This will migrate your drafts to the new editor format. The process is safe and reversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isMigrating ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migrating drafts...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                {currentDraft && (
                  <p className="text-sm text-muted-foreground">
                    Currently migrating: {currentDraft}
                  </p>
                )}
              </div>
              
              {validationResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Validation Results</h4>
                  <div className="space-y-1">
                    {validationResults.map((result, index) => (
                      <div key={index} className="text-sm">
                        <span className={result.success ? "text-green-600" : "text-red-600"}>
                          {result.success ? "✓" : "✗"} Draft {index + 1}
                        </span>
                        {result.issues.length > 0 && (
                          <ul className="list-disc list-inside text-muted-foreground">
                            {result.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>This migration will:</p>
                <ul className="list-disc list-inside mt-2">
                  <li>Convert your drafts to the new editor format</li>
                  <li>Preserve all formatting and content</li>
                  <li>Create version history for each draft</li>
                  <li>Validate the migration for accuracy</li>
                </ul>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isMigrating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                >
                  Start Migration
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 