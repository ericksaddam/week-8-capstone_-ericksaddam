import { useState } from 'react';
import { KnowledgeBaseEntry } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, BookOpen } from 'lucide-react';
import { CreateKnowledgeBaseEntryForm } from '../forms/CreateKnowledgeBaseEntryForm';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ClubKnowledgeBaseProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
  knowledgeBase: KnowledgeBaseEntry[];
}

export const ClubKnowledgeBase = ({ 
  clubId, 
  currentUserRole, 
  knowledgeBase = [] 
}: ClubKnowledgeBaseProps) => {
  const [localEntries, setLocalEntries] = useState<KnowledgeBaseEntry[]>(knowledgeBase);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreateArticle = currentUserRole === 'admin' || currentUserRole === 'owner';

  const handleSuccess = (newEntry: KnowledgeBaseEntry) => {
    setLocalEntries(prev => [newEntry, ...prev]);
    toast.success('Article created successfully!');
    setIsCreateModalOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>SOPs, guides, and important documents for the club.</CardDescription>
        </div>
        {canCreateArticle && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create a New Knowledge Base Article</DialogTitle>
                <DialogDescription>
                  Publish a new guide or document for club members.
                </DialogDescription>
              </DialogHeader>
              <CreateKnowledgeBaseEntryForm clubId={clubId} onSuccess={handleSuccess} onCancel={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

      </CardHeader>
      <CardContent>
        {localEntries.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">The Library is Empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start by publishing the first article.</p>
            {canCreateArticle && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Article
              </Button>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {localEntries.map((entry) => (
              <AccordionItem value={entry._id} key={entry._id}>
                <AccordionTrigger className="font-semibold hover:no-underline text-lg">{entry.title}</AccordionTrigger>
                <AccordionContent className="prose max-w-none dark:prose-invert">
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
