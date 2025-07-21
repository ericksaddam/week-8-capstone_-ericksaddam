import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminApi, User } from '@/api';
import { toast } from 'sonner';

interface UserWithStats extends User {
  tasksCompleted: number;
  clubsJoined: number;
  lastActivity: string;
}

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [userToView, setUserToView] = useState<UserWithStats | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserWithStats | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserWithStats | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers();
      
      // Backend now provides real statistics
      const usersWithStats: UserWithStats[] = response.users.map(user => ({
        ...user,
        tasksCompleted: user.tasksCompleted || 0,
        clubsJoined: user.clubsJoined || 0,
        lastActivity: user.lastActivity || user.updatedAt || user.createdAt
      }));
      
      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.isActive;
        if (statusFilter === 'blocked') return !user.isActive;
        return true;
      });
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter, roleFilter]);

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await Promise.all(
            selectedUsers.map(userId => 
              adminApi.updateUser(userId, { isActive: true })
            )
          );
          toast.success(`Activated ${selectedUsers.length} users`);
          break;
        case 'deactivate':
          await Promise.all(
            selectedUsers.map(userId => 
              adminApi.updateUser(userId, { isActive: false })
            )
          );
          toast.success(`Deactivated ${selectedUsers.length} users`);
          break;
        case 'export':
          exportSelectedUsers();
          return;
      }
      
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Bulk action failed');
    }
  };

  const exportSelectedUsers = () => {
    const selectedUserData = filteredUsers.filter(user => 
      selectedUsers.includes(user._id)
    );
    
    const csvContent = [
      'Name,Email,Role,Status,Tasks Completed,Clubs Joined,Last Activity',
      ...selectedUserData.map(user => 
        `${user.name},${user.email},${user.role},${user.isActive ? 'Active' : 'Blocked'},${user.tasksCompleted},${user.clubsJoined},${new Date(user.lastActivity).toLocaleDateString()}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u._id === userId);
      if (user?.isActive) {
        await adminApi.blockUser(userId);
      } else {
        await adminApi.unblockUser(userId);
      }
      toast.success('User status updated');
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const getStatusBadge = (user: UserWithStats) => {
    if (!user.isActive) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    
    const lastActivity = new Date(user.lastActivity);
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActivity <= 7) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (daysSinceActivity <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Dormant</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      user: 'bg-blue-100 text-blue-800',
      moderator: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || colors.user}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedUsers.length} user(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({filteredUsers.length})
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                No users match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onCheckedChange={(checked) => handleSelectUser(user._id, checked as boolean)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last active {new Date(user.lastActivity).toLocaleDateString()}
                      </div>
                      <div>{user.tasksCompleted} tasks completed</div>
                      <div>{user.clubsJoined} clubs joined</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user)}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setUserToView(user)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setUserToEdit(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleUserStatus(user._id)}
                        className={user.isActive ? "text-red-600" : "text-green-600"}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Block User
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unblock User
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!userToView} onOpenChange={() => setUserToView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about {userToView?.name}
            </DialogDescription>
          </DialogHeader>
          {userToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{userToView.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{userToView.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <div className="mt-1">{getRoleBadge(userToView.role)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(userToView)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Tasks Completed</label>
                  <p className="text-sm text-muted-foreground">{userToView.tasksCompleted}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Clubs Joined</label>
                  <p className="text-sm text-muted-foreground">{userToView.clubsJoined}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Joined Date</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userToView.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Activity</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userToView.lastActivity).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
