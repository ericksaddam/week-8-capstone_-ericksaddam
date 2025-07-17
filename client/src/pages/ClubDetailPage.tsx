import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Club, fetchClubById } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClubCommunities } from '@/components/club/ClubCommunities';
import { ClubGoals } from '@/components/club/ClubGoals';
import { ClubDiscussions } from '@/components/club/ClubDiscussions';
import { ClubKnowledgeBase } from '@/components/club/ClubKnowledgeBase';
import { ClubMembers } from '@/components/club/ClubMembers';

const ClubDetailPage = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    const loadClubDetails = async () => {
      try {
        setLoading(true);
        const clubData = await fetchClubById(clubId);
        setClub(clubData);
      } catch (err) {
        console.error('Error loading club details:', err);
        setError('Failed to load club details.');
      } finally {
        setLoading(false);
      }
    };
    loadClubDetails();
  }, [clubId]);

  if (loading) {
    return <div className="text-center py-12">Loading club details...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!club) {
    return <div className="text-center py-12">Club not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
        <p className="text-muted-foreground">{club.description}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{club.description}</p>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Club Members</h3>
                <p>{club.members?.length || 0} members</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <ClubMembers 
            clubId={club._id} 
            currentUserRole={user?.role}
            members={club.members || []} 
          />
        </TabsContent>

        <TabsContent value="communities">
          <ClubCommunities 
            clubId={club._id} 
            currentUserRole={user?.role}
            communities={club.communities || []} 
          />
        </TabsContent>

        <TabsContent value="goals">
          <ClubGoals 
            clubId={club._id} 
            currentUserRole={user?.role}
            goals={club.goals || []} 
          />
        </TabsContent>

        <TabsContent value="discussions">
          <ClubDiscussions 
            clubId={club._id} 
            currentUserRole={user?.role}
            topics={club.topics || []} 
          />
        </TabsContent>

        <TabsContent value="knowledge">
          <ClubKnowledgeBase 
            clubId={club._id} 
            currentUserRole={user?.role}
            knowledgeBase={club.knowledgeBase || []} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetailPage;
