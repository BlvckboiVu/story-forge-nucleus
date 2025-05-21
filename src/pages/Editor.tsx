
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';

export default function Editor() {
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: "Document saved",
      description: "Your document has been saved successfully",
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Chapter 1: The Beginning</h1>
          <p className="text-sm text-muted-foreground">
            In Project: "The Great Novel" · Last saved 5 minutes ago
          </p>
        </div>
        <Button onClick={handleSave} className="hidden sm:flex">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
        {/* Mobile outline toggle */}
        <div className="md:hidden">
          <Collapsible
            open={isOutlineVisible}
            onOpenChange={setIsOutlineVisible}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full mb-2 flex items-center justify-between">
                <span>Outline</span>
                {isOutlineVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-4">
              <Card className="p-4 space-y-2">
                <p className="font-medium">Chapter Structure</p>
                <ul className="space-y-1 text-sm">
                  <li className="pl-2 border-l-2 border-primary">Introduction of main character</li>
                  <li className="pl-2 border-l-2 border-muted">Setting the scene</li>
                  <li className="pl-2 border-l-2 border-muted">Initial conflict</li>
                  <li className="pl-2 border-l-2 border-muted">Character decision</li>
                </ul>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {/* Desktop outline sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0 overflow-auto">
          <Card className="p-4 h-full">
            <h3 className="font-medium mb-4">Chapter Outline</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Structure</p>
                <ul className="space-y-2 text-sm">
                  <li className="pl-2 border-l-2 border-primary">Introduction of main character</li>
                  <li className="pl-2 border-l-2 border-muted">Setting the scene</li>
                  <li className="pl-2 border-l-2 border-muted">Initial conflict</li>
                  <li className="pl-2 border-l-2 border-muted">Character decision</li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <div className="text-sm">
                  Remember to emphasize the character's internal struggle with their past.
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Editor area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Card className="p-6 h-full bg-paper dark:bg-paper-dark shadow-sm">
            <div className="writing-container p-0 m-0 shadow-none h-full">
              <div className="content-editable h-full" contentEditable suppressContentEditableWarning>
                <p>
                  The morning light filtered through the dusty blinds, 
                  casting long shadows across the wooden floor. Sarah 
                  stared at her reflection in the mirror, barely 
                  recognizing the person staring back at her.
                </p>
                <p>
                  "Today will be different," she whispered to herself, 
                  a promise she had made many times before.
                </p>
                <p>
                  Click here to continue writing your story...
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Mobile save button */}
      <div className="md:hidden mt-4">
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
