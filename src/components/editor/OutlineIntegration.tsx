
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Outline from '@/components/Outline';
import OutlineTimeline from '@/components/OutlineTimeline';
import { EnhancedOutline, OutlineScene } from '@/types/outline';

interface OutlineIntegrationProps {
  projectId: string;
  outline: EnhancedOutline | null;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  showOutline: boolean;
  onToggleOutline: () => void;
}

export default function OutlineIntegration({
  projectId,
  outline,
  onSceneSelect,
  showOutline,
  onToggleOutline
}: OutlineIntegrationProps) {
  const isMobile = useIsMobile();

  const OutlinePanel = () => (
    <Tabs defaultValue="outline" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 m-2">
        <TabsTrigger value="outline" className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Outline
        </TabsTrigger>
        <TabsTrigger value="timeline" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Timeline
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="outline" className="flex-1 overflow-hidden m-2 mt-0">
        <Outline
          projectId={projectId}
          onSceneSelect={onSceneSelect}
          className="h-full"
        />
      </TabsContent>
      
      <TabsContent value="timeline" className="flex-1 overflow-hidden m-2 mt-0">
        {outline && (
          <OutlineTimeline
            outline={outline}
            onSceneSelect={onSceneSelect}
            className="h-full"
          />
        )}
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Sheet open={showOutline} onOpenChange={onToggleOutline}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            title="Story Outline"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <div className="h-full">
            <OutlinePanel />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleOutline}
        title="Toggle Outline"
      >
        <BookOpen className="h-4 w-4" />
      </Button>
      {showOutline && (
        <div className="w-96 border-l bg-card min-w-0 flex-shrink-0">
          <OutlinePanel />
        </div>
      )}
    </>
  );
}
