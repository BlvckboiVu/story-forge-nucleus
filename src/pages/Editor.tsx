import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProjects } from '@/contexts/ProjectContext';
import { useDrafts } from '@/hooks/useDrafts';
import { Draft } from '@/types';

export default function Editor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects } = useProjects();
  const { drafts, loading, error, createDraft, updateDraft } = useDrafts(projectId);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (drafts.length > 0) {
      setCurrentDraft(drafts[0]);
      setContent(drafts[0].content);
    }
  }, [drafts]);

  const handleSave = async () => {
    if (!currentDraft) {
      const newDraft = await createDraft({
        title: 'Untitled Draft',
        content,
        projectId: projectId || '',
      });
      setCurrentDraft(newDraft);
    } else {
      await updateDraft(currentDraft.id, {
        content,
      });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <Layout mode="contained">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {currentDraft?.title || 'Untitled Draft'}
          </h1>
          <Button onClick={handleSave}>Save</Button>
        </div>

        <Textarea
          value={content}
          onChange={handleContentChange}
          className="min-h-[500px] font-mono"
          placeholder="Start writing your story..."
        />
      </div>
    </Layout>
  );
}
