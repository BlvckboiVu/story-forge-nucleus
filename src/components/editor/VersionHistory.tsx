import { useState } from 'react';
import { DocumentVersion } from '@/lib/versioning';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  getVersionLabel,
  getVersionMetadata,
  getVersionDiff,
  compareVersions,
} from '@/utils/versioning';
import { Clock, Plus, Minus } from 'lucide-react';

interface VersionHistoryProps {
  versions: DocumentVersion[];
  currentVersion: DocumentVersion;
  onVersionSelect: (version: DocumentVersion) => void;
  className?: string;
}

export function VersionHistory({
  versions,
  currentVersion,
  onVersionSelect,
  className,
}: VersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  
  const sortedVersions = [...versions].sort(compareVersions);
  
  const handleVersionSelect = (version: DocumentVersion) => {
    setSelectedVersion(version);
    const diff = getVersionDiff(version, currentVersion);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {getVersionLabel(version)}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-600">
              <Plus className="h-4 w-4" />
              {diff.added}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <Minus className="h-4 w-4" />
              {diff.removed}
            </span>
          </div>
        </div>
        
        <div className="text-sm">
          <p>Font: {getVersionMetadata(version).font}</p>
          <p>View Mode: {getVersionMetadata(version).viewMode}</p>
          <p>Word Count: {version.wordCount}</p>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
        >
          <Clock className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              value={selectedVersion?.id}
              onValueChange={(id) => {
                const version = versions.find((v) => v.id === id);
                if (version) {
                  setSelectedVersion(version);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a version" />
              </SelectTrigger>
              <SelectContent>
                {sortedVersions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {getVersionLabel(version)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedVersion && (
              <div className="mt-4">
                {handleVersionSelect(selectedVersion)}
              </div>
            )}
          </div>
          
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {selectedVersion && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
              />
            )}
          </ScrollArea>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          
          <Button
            onClick={() => {
              if (selectedVersion) {
                onVersionSelect(selectedVersion);
                setIsOpen(false);
              }
            }}
          >
            Restore Version
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 