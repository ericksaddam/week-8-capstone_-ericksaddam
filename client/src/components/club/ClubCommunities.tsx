import { useState } from 'react';
import { Community } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { CreateCommunityForm } from '../forms/CreateCommunityForm';
import { toast } from 'sonner';

interface ClubCommunitiesProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
  communities: Community[];
}

export const ClubCommunities = ({ 
  clubId, 
  currentUserRole, 
  communities = [] 
}: ClubCommunitiesProps) => {
  const [localCommunities, setLocalCommunities] = useState<Community[]>(communities);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canRequestCommunity = currentUserRole === 'admin' || currentUserRole === 'owner';
  
  const handleCreationSuccess = (newCommunity: Community) => {
    setLocalCommunities(prev => [...prev, newCommunity]);
    toast.success('Community requested!', { 
      description: 'It will appear once approved by an admin.' 
    });
    setIsCreateModalOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Communities</CardTitle>
        {canRequestCommunity && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Request Community
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Request a New Community</DialogTitle>
                <DialogDescription>
                  Your request will be sent to the club owner for approval.
                </DialogDescription>
              </DialogHeader>
              <CreateCommunityForm
                clubId={clubId}
                onSuccess={handleCreationSuccess}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

      </CardHeader>
      <CardContent>
        {localCommunities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No communities yet.</p>
            {canRequestCommunity && (
              <Button variant="link" onClick={() => setIsCreateModalOpen(true)} className="mt-2">
                Be the first to create one!
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localCommunities.map((community) => (
              <div key={community._id} className="p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{community.name}</h4>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full mt-2 inline-block ${
                      community.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : community.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {community.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{community.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
