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
  // Get the clubId from URL params
  const params = useParams<{ clubId: string }>();
  const clubId = params?.clubId;
  
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch club data when clubId is available
  useEffect(() => {
    if (!clubId) {
      const errorMsg = 'No club ID provided in the URL. Please check the URL and try again.';
      console.error(errorMsg, { 
        params, 
        pathname: window.location.pathname,
        search: window.location.search
      });
      setError(errorMsg);
      setLoading(false);
      setClub(null);
      return;
    }

    console.log('Fetching club details for clubId:', clubId);
    
    let isMounted = true;
    
    const loadClubDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Calling fetchClubById with clubId:', clubId);
        const clubData = await fetchClubById(clubId);
        
        if (!isMounted) {
          console.log('Component unmounted, skipping state update');
          return;
        }
        
        console.log('Received club data:', clubData);
        setClub(clubData.club);
      } catch (err) {
        console.error('Failed to load club details:', {
          error: err,
          message: (err as Error).message,
          status: (err as any).response?.status,
          data: (err as any).response?.data
        });
        
        if (isMounted) {
            const errorMessage = (err as any).response?.data?.message || 
                            'Failed to load club details. Please try again later.';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadClubDetails();
    
    return () => {
      isMounted = false;
    };
  }, [clubId, params]);

  // Log the club data being passed to child components
  useEffect(() => {
    if (!club) return;
    console.log('Rendering ClubDetailPage with club:', {
      _id: club._id,
      name: club.name,
      goalsCount: club.goals?.length || 0,
      membersCount: club.members?.length || 0,
      currentUserRole: user?.role
    });
  }, [club, user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">Loading club details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          <h3 className="font-bold">Error Loading Club</h3>
          <p className="mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-destructive text-white rounded-md hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Club Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested club could not be found or you don't have permission to view it.</p>
      </div>
    );
  }



  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{club.name}</h1>
        {club.description && (
          <p className="text-muted-foreground mt-2">{club.description}</p>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <ClubMembers 
                clubId={club._id} 
                members={club.members} 
                currentUserRole={user?.role} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About This Club</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Created On</h3>
                  <p className="text-muted-foreground">
                    {new Date(club.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {club.communities?.length > 0 && (
                  <div>
                    <h3 className="font-medium">Communities</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {club.communities.map(community => (
                        <span key={community._id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                          {community.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <ClubGoals 
            key={`goals-${club._id}`} // Force re-render when clubId changes
            clubId={club._id} 
            currentUserRole={user?.role}
          />
        </TabsContent>

        <TabsContent value="discussions">
          <ClubDiscussions 
            key={`discussions-${club._id}`} // Force re-render when clubId changes
            clubId={club._id} 
            currentUserRole={user?.role}
          />
        </TabsContent>

        <TabsContent value="knowledge">
          <ClubKnowledgeBase 
            clubId={club._id} 
            currentUserRole={user?.role}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetailPage;
