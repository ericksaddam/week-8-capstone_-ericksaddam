import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllApprovedClubs, 
  fetchUserClubs, 
  fetchPendingClubs, 
  fetchLeftClubs,
  requestToJoinClub,
  leaveClub,
  rejoinClub,
  Club as ApiClub 
} from '../api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Users, Clock, LogOut, RotateCcw } from 'lucide-react';

type ClubStatus = 'idle' | 'pending' | 'joined' | 'left';

interface Club extends ApiClub {
  joinStatus?: ClubStatus;
  memberRole?: 'member' | 'admin' | 'owner';
}

type TabType = 'discover' | 'my-clubs' | 'pending' | 'left';

const DiscoverClubs: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchClubs = useCallback(async (tab: TabType) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let fetchedClubs: Club[] = [];
      
      switch (tab) {
        case 'discover':
          const [allClubs, myClubs] = await Promise.all([
            fetchAllApprovedClubs(),
            fetchUserClubs()
          ]);
          const myClubIds = new Set(myClubs.map(club => club._id));
          fetchedClubs = allClubs.filter(club => !myClubIds.has(club._id));
          break;
        case 'my-clubs':
          fetchedClubs = await fetchUserClubs();
          break;
        case 'pending':
          fetchedClubs = await fetchPendingClubs();
          break;
        case 'left':
          fetchedClubs = await fetchLeftClubs();
          break;
      }
      
      setClubs(fetchedClubs);
    } catch (err) {
      console.error(`Error fetching ${tab} clubs:`, err);
      setError(`Failed to load ${tab === 'discover' ? 'clubs' : tab}. Please try again.`);
      toast.error(`Failed to load ${tab === 'discover' ? 'clubs' : tab}.`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClubs(activeTab);
  }, [fetchClubs, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const handleJoinRequest = async (clubId: string) => {
    if (!user) {
      toast.error('Please log in to join a club');
      return;
    }

    setActionLoading(prev => ({ ...prev, [`join-${clubId}`]: true }));

    try {
      await requestToJoinClub(clubId);
      
      setClubs(prevClubs =>
        prevClubs.map(club =>
          club._id === clubId
            ? { ...club, joinStatus: 'pending' as const }
            : club
        )
      );
      
      toast.success('Join request sent successfully');
    } catch (error) {
      console.error('Error requesting to join club:', error);
      toast.error('Failed to send join request. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`join-${clubId}`]: false }));
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to leave this club?')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [`leave-${clubId}`]: true }));

    try {
      await leaveClub(clubId);
      
      // If on the 'my-clubs' tab, remove the club from the list
      if (activeTab === 'my-clubs') {
        setClubs(prevClubs => prevClubs.filter(club => club._id !== clubId));
      } else {
        // Otherwise, just update the status
        setClubs(prevClubs =>
          prevClubs.map(club =>
            club._id === clubId
              ? { ...club, joinStatus: 'left' as const }
              : club
          )
        );
      }
      
      toast.success('You have left the club');
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave club. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`leave-${clubId}`]: false }));
    }
  };

  const handleRejoinClub = async (clubId: string) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [`rejoin-${clubId}`]: true }));

    try {
      await rejoinClub(clubId);
      
      // If on the 'left' tab, remove the club from the list
      if (activeTab === 'left') {
        setClubs(prevClubs => prevClubs.filter(club => club._id !== clubId));
      } else {
        // Otherwise, update the status
        setClubs(prevClubs =>
          prevClubs.map(club =>
            club._id === clubId
              ? { ...club, joinStatus: 'pending' as const }
              : club
          )
        );
      }
      
      toast.success('Rejoin request sent. Waiting for approval.');
    } catch (error) {
      console.error('Error rejoining club:', error);
      toast.error('Failed to rejoin club. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`rejoin-${clubId}`]: false }));
    }
  };

  const renderClubCard = (club: Club) => {
    const isLoading = actionLoading[`join-${club._id}`] || 
                     actionLoading[`leave-${club._id}`] || 
                     actionLoading[`rejoin-${club._id}`];

    return (
      <Card key={club._id} className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span>{club.name}</span>
            {club.memberRole === 'owner' && (
              <Badge variant="secondary" className="ml-2">Owner</Badge>
            )}
            {club.memberRole === 'admin' && (
              <Badge variant="outline" className="ml-2">Admin</Badge>
            )}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {club.description || 'No description provided'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Users className="h-4 w-4 mr-1.5" />
            <span>{club.members?.length || 0} {club.members?.length === 1 ? 'member' : 'members'}</span>
          </div>
          {club.createdBy && (
            <div className="text-sm text-muted-foreground">
              Created by: {typeof club.createdBy === 'object' ? club.createdBy.name : 'Unknown'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {activeTab === 'discover' && (
            <Button 
              className="w-full" 
              onClick={() => handleJoinRequest(club._id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : 'Join Club'}
            </Button>
          )}

          {activeTab === 'my-clubs' && (
            <>
              <Button variant="outline" className="w-full" asChild>
                <a href={`/clubs/${club._id}`}>
                  View Club
                </a>
              </Button>
              {!['owner', 'admin'].includes(club.memberRole || '') && (
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleLeaveClub(club._id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Leave Club
                </Button>
              )}
            </>
          )}

          {activeTab === 'pending' && (
            <Button variant="outline" className="w-full" disabled>
              <Clock className="mr-2 h-4 w-4" />
              Pending Approval
            </Button>
          )}

          {activeTab === 'left' && (
            <Button 
              className="w-full" 
              onClick={() => handleRejoinClub(club._id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Rejoin Club
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Clubs</h1>
          <p className="text-muted-foreground">
            {activeTab === 'discover' && 'Discover and join new clubs'}
            {activeTab === 'my-clubs' && 'Manage your club memberships'}
            {activeTab === 'pending' && 'Your pending club join requests'}
            {activeTab === 'left' && 'Clubs you have left'}
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">
              <Users className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-clubs">
              <Users className="h-4 w-4 mr-2" />
              My Clubs
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="left">
              <LogOut className="h-4 w-4 mr-2" />
              Left Clubs
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 border rounded-lg">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={() => fetchClubs(activeTab)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : clubs.length === 0 ? (
                <div className="text-center py-16 border rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">
                    {activeTab === 'discover' && 'No clubs available'}
                    {activeTab === 'my-clubs' && 'No clubs joined yet'}
                    {activeTab === 'pending' && 'No pending requests'}
                    {activeTab === 'left' && 'No left clubs'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'discover' && 'Check back later for new clubs'}
                    {activeTab === 'my-clubs' && 'Discover and join clubs to get started'}
                    {activeTab === 'pending' && 'Your join requests will appear here'}
                    {activeTab === 'left' && 'Clubs you have left will appear here'}
                  </p>
                  {activeTab !== 'discover' && (
                    <Button onClick={() => setActiveTab('discover')}>
                      <Users className="mr-2 h-4 w-4" />
                      Discover Clubs
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clubs.map(club => renderClubCard(club))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default DiscoverClubs;
