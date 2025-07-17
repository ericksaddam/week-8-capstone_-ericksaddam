import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClubMember, updateClubMemberRole, removeMemberFromClub } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddMemberForm } from '../forms/AddMemberForm';

interface ClubMembersProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
  members: ClubMember[];
}

export const ClubMembers = ({ clubId, currentUserRole, members = [] }: ClubMembersProps) => {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [localMembers, setLocalMembers] = useState<ClubMember[]>(members);
  const isCurrentUserAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin') => {
    try {
      await updateClubMemberRole(clubId, memberId, newRole);
      setLocalMembers(prevMembers => 
        prevMembers.map(member => 
          member.user._id === memberId 
            ? { ...member, role: newRole } 
            : member
        )
      );
      toast.success('Member role updated.');
    } catch (error) {
      toast.error('Failed to update role.', { description: (error as Error).message });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberFromClub(clubId, memberId);
      setLocalMembers(prevMembers => 
        prevMembers.filter(member => member.user._id !== memberId)
      );
      toast.success('Member removed from club.');
    } catch (error) {
      toast.error('Failed to remove member.', { description: (error as Error).message });
    }
  };

  const handleAddMember = (newMember: ClubMember) => {
    setLocalMembers(prevMembers => [...prevMembers, newMember]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage who is in your club.</CardDescription>
        </div>
        {isCurrentUserAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>Search for a user and add them to the club.</DialogDescription>
              </DialogHeader>
              <AddMemberForm 
                clubId={clubId} 
                onSuccess={(newMember) => { 
                  handleAddMember(newMember); 
                  setIsAddModalOpen(false); 
                }} 
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              {isCurrentUserAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {localMembers.map((member) => (
              <TableRow key={member.user._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{member.user.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {isCurrentUserAdmin && member.role !== 'owner' ? (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) => handleRoleChange(member.user._id, value as 'member' | 'admin')}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="capitalize">{member.role}</span>
                  )}
                </TableCell>
                {isCurrentUserAdmin && (
                  <TableCell className="text-right">
                    {member.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {member.user.name} from the club.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.user._id)} className="bg-destructive hover:bg-destructive/90">
                              Remove Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
