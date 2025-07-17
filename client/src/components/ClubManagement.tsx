import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, RefreshCw } from "lucide-react";
import ClubCard from "./ClubCard";
import { CreateClubForm } from "./forms/CreateClubForm";
import { AddMemberForm, NewMember } from "./forms/AddMemberForm";
import { fetchUserClubs, Club, User } from "@/api";
import { useAuth } from "@/hooks/useAuth";

export const ClubManagement = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClubForMember, setSelectedClubForMember] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadClubs = useCallback(async () => {
    setLoading(true);
    try {
      const userClubs = await fetchUserClubs();
      setClubs(userClubs);
      setError(null);
    } catch (err) {
      console.error("Error loading clubs:", err);
      setError("Failed to load your clubs. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const handleClubCreate = () => {
    setIsCreateModalOpen(false);
    loadClubs();
  };

  const handleMemberAdd = (clubId: string, member: NewMember) => {
    setClubs(prev => prev.map(club => 
      club._id === clubId 
        ? { 
            ...club, 
            members: [
              ...(club.members || []), 
              { user: member as User, role: 'member' } 
            ] 
          } 
        : club
    ));
    setSelectedClubForMember(null);
  };

  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (club.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserClubOwner = (club: Club) => {
    if (!user) return false;
    const member = club.members?.find(m => 
      (typeof m.user === 'string' ? m.user === user._id : m.user._id === user._id)
    );
    return member?.role === 'owner' || member?.role === 'admin';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Clubs</h2>
          <p className="text-muted-foreground">Manage your clubs and communities</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Club</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new club.
                </DialogDescription>
              </DialogHeader>
              <CreateClubForm onSuccess={handleClubCreate} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <a href="/discover">
              <Users className="mr-2 h-4 w-4" />
              Discover More
            </a>
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your clubs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading your clubs...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={loadClubs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No clubs found</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? 'No clubs match your search. Try different keywords.'
              : "You haven't joined any clubs yet. Discover and join clubs to get started!"
            }
          </p>
          <div className="pt-4">
            <Button asChild>
              <a href="/discover">
                <Users className="mr-2 h-4 w-4" />
                Discover Clubs
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club._id}
              club={club}
              isOwner={isUserClubOwner(club)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedClubForMember} onOpenChange={(open) => !open && setSelectedClubForMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Invite a new member to your club by entering their email address.
            </DialogDescription>
          </DialogHeader>
          {selectedClubForMember && (
            <AddMemberForm
              clubId={selectedClubForMember}
              onSuccess={(member) => handleMemberAdd(selectedClubForMember, member)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};