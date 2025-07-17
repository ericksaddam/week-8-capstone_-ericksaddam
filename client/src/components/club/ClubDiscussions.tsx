import { useState } from 'react';
import { Topic, createTopicReply } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageSquare } from 'lucide-react';
import { CreateTopicForm } from '../forms/CreateTopicForm';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ClubDiscussionsProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
  topics: Topic[];
}

const replySchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty.'),
});

export const ClubDiscussions = ({ 
  clubId, 
  currentUserRole, 
  topics = [] 
}: ClubDiscussionsProps) => {
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreateTopic = currentUserRole === 'admin' || currentUserRole === 'owner' || currentUserRole === 'member';

  const handleSuccess = (newTopic: Topic) => {
    setLocalTopics(prev => [newTopic, ...prev]);
    setIsCreateModalOpen(false);
  };

  const ReplyForm = ({ topicId }: { topicId: string }) => {
    const form = useForm<z.infer<typeof replySchema>>({ resolver: zodResolver(replySchema) });

    const onSubmit = async (values: z.infer<typeof replySchema>) => {
      try {
        const newReply = await createTopicReply(clubId, topicId, values);
        setLocalTopics(prevTopics => 
          prevTopics.map(topic => 
            topic._id === topicId 
              ? { ...topic, replies: [...(topic.replies || []), newReply] } 
              : topic
          )
        );
        toast.success('Reply posted!');
        form.reset({ content: '' });
      } catch (error) {
        toast.error('Failed to post reply.', { description: (error as Error).message });
      }
    };

    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start space-x-4 mt-4 pl-12">
        <Textarea {...form.register('content')} placeholder="Write a reply..." className="flex-grow" />
        <Button type="submit" disabled={form.formState.isSubmitting}>Reply</Button>
      </form>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Discussions</CardTitle>
          <CardDescription>Ask questions, share ideas, and connect with other members.</CardDescription>
        </div>
        {canCreateTopic && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Start New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Start a New Discussion</DialogTitle>
                <DialogDescription>
                  Create a new topic for club members to discuss.
                </DialogDescription>
              </DialogHeader>
              <CreateTopicForm clubId={clubId} onSuccess={handleSuccess} onCancel={() => setIsCreateModalOpen(false)} />
            </DialogContent>
          </Dialog>
        )}

      </CardHeader>
      <CardContent>
        {localTopics.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Discussions Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to start a discussion.</p>
            {canCreateTopic && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Start a Discussion
              </Button>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {localTopics.map((topic) => (
              <AccordionItem value={topic._id} key={topic._id}>
                <AccordionTrigger className="font-semibold hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={topic.user.avatar} />
                      <AvatarFallback>{topic.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{topic.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <p className="text-muted-foreground pl-12">{topic.content}</p>
                  {topic.replies.map((reply) => (
                    <div key={reply._id} className="flex items-start space-x-3 pl-12">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.user.avatar} />
                        <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <p className="font-semibold text-sm">{reply.user.name}</p>
                        <p className="text-muted-foreground text-sm">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                  <ReplyForm topicId={topic._id} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
