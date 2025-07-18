import { useState, useEffect } from 'react';
import { KnowledgeBaseEntry, fetchKnowledgeBase } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { CreateKnowledgeBaseEntryForm } from '../forms/CreateKnowledgeBaseEntryForm';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClubKnowledgeBaseProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
}

export const ClubKnowledgeBase = ({ 
  clubId, 
  currentUserRole
}: ClubKnowledgeBaseProps) => {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreateArticle = currentUserRole === 'admin' || currentUserRole === 'owner';

  if (!clubId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Club ID is missing. Cannot load knowledge base.
        </AlertDescription>
      </Alert>
    );
  }

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEntries = await fetchKnowledgeBase(clubId);
      setEntries(fetchedEntries);
    } catch (err) {
      console.error('Error loading knowledge base:', err);
      setError('Failed to load knowledge base. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clubId) {
      loadEntries();
    }
  }, [clubId]);

  const handleSuccess = (newEntry: KnowledgeBaseEntry) => {
    setEntries(prev => [newEntry, ...prev]);
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
        <div className="flex gap-2">
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
          <Button size="sm" variant="outline" onClick={loadEntries}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading knowledge base...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadEntries} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : entries.length === 0 ? (
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
            {entries.map((entry) => (
              <AccordionItem value={entry._id} key={entry._id}>
                <AccordionTrigger className="font-semibold hover:no-underline text-lg">{entry.title}</AccordionTrigger>
                <AccordionContent className="prose max-w-none dark:prose-invert">
                  <ReactMarkdown>{entry.content}</ReactMarkdown>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 not-prose">
                      {entry.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
