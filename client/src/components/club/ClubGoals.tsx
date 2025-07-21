import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Target, 
  CheckSquare, 
  Calendar, 
  Users, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  BarChart3,
  Clock,
  AlertCircle,
  Eye,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { CreateGoalForm } from '../forms/CreateGoalForm';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface Goal {
  _id: string;
  title: string;
  description: string;
  format: 'SMART' | 'OKR';
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  dueDate: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  club: {
    _id: string;
    name: string;
  };
  objectives: any[];
  tasks: any[];
  createdAt: string;
  calculatedProgress?: number;
  isOverdue?: boolean;
  daysRemaining?: number;
}

interface Objective {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  dueDate: string;
  goal: {
    _id: string;
    title: string;
  };
  keyResults: any[];
  tasks: any[];
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  dueDate: string;
  assignedTo: any[];
  goal?: {
    _id: string;
    title: string;
  };
  objective?: {
    _id: string;
    title: string;
  };
  club: {
    _id: string;
    name: string;
  };
}

interface ClubGoalsProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
}

export const ClubGoals = ({ 
  clubId, 
  currentUserRole
}: ClubGoalsProps) => {
  // State management
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalDetailsLoading, setGoalDetailsLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  const canCreateGoal = currentUserRole === 'admin' || currentUserRole === 'owner';

  if (!clubId) {
    console.error('Club ID is missing in ClubGoals component');
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Club ID is missing. Cannot load goals.
        </AlertDescription>
      </Alert>
    );
  }

  // API calls
  const fetchClubGoals = async () => {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/goals`);
      return response.data.goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  };

  const fetchGoalObjectives = async (goalId: string) => {
    try {
      const response = await apiClient.get(`/goals/${goalId}/objectives`);
      return response.data.objectives || [];
    } catch (error) {
      console.error('Error fetching objectives:', error);
      throw error;
    }
  };

  const fetchClubTasks = async () => {
    try {
      const response = await apiClient.get(`/clubs/${clubId}/tasks`);
      return response.data.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  };

  const fetchGoalDetails = async (goalId: string) => {
    try {
      const response = await apiClient.get(`/goals/${goalId}`);
      return response.data.goal;
    } catch (error) {
      console.error('Error fetching goal details:', error);
      throw error;
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [goalsData, tasksData] = await Promise.all([
        fetchClubGoals(),
        fetchClubTasks()
      ]);
      
      setGoals(goalsData);
      setTasks(tasksData);
      
      // Fetch objectives for all goals
      const allObjectives: Objective[] = [];
      for (const goal of goalsData) {
        try {
          const goalObjectives = await fetchGoalObjectives(goal._id);
          allObjectives.push(...goalObjectives);
        } catch (error) {
          console.error(`Error fetching objectives for goal ${goal._id}:`, error);
        }
      }
      setObjectives(allObjectives);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load goals data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (clubId && mounted) {
        await loadAllData();
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [clubId]);

  const handleCreationSuccess = (newGoal: Goal) => {
    setGoals(prev => [...prev, newGoal]);
    toast.success('Goal created successfully!');
    setIsCreateModalOpen(false);
    loadAllData(); // Refresh all data
  };

  const handleViewGoalDetails = async (goal: Goal) => {
    try {
      setGoalDetailsLoading(true);
      const detailedGoal = await fetchGoalDetails(goal._id);
      setSelectedGoal(detailedGoal);
    } catch (error) {
      toast.error('Failed to load goal details');
    } finally {
      setGoalDetailsLoading(false);
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      active: { variant: 'default' as const, label: 'Active' },
      on_hold: { variant: 'outline' as const, label: 'On Hold' },
      completed: { variant: 'default' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      todo: { variant: 'secondary' as const, label: 'To Do' },
      in_progress: { variant: 'default' as const, label: 'In Progress' },
      review: { variant: 'outline' as const, label: 'Review' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: 'outline' as const, label: 'Low', className: 'border-green-500 text-green-700' },
      medium: { variant: 'outline' as const, label: 'Medium', className: 'border-yellow-500 text-yellow-700' },
      high: { variant: 'outline' as const, label: 'High', className: 'border-orange-500 text-orange-700' },
      critical: { variant: 'outline' as const, label: 'Critical', className: 'border-red-500 text-red-700' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  // Filter functions
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || goal.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || goal.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredObjectives = objectives.filter(objective => {
    const matchesSearch = objective.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         objective.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || objective.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || objective.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    totalObjectives: objectives.length,
    completedObjectives: objectives.filter(o => o.status === 'completed').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Goals</p>
                <p className="text-2xl font-bold">{stats.completedGoals}/{stats.totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Objectives</p>
                <p className="text-2xl font-bold">{stats.completedObjectives}/{stats.totalObjectives}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}/{stats.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goals Management
              </CardTitle>
              <CardDescription>
                Manage goals, objectives, and tasks for this club
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              {canCreateGoal && (
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create a New Goal</DialogTitle>
                    </DialogHeader>
                    <CreateGoalForm
                      clubId={clubId}
                      onSuccess={handleCreationSuccess}
                      onCancel={() => setIsCreateModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
              <Button size="sm" variant="outline" onClick={loadAllData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search goals, objectives, tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading goals data...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={loadAllData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="goals" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="goals" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goals ({filteredGoals.length})
                </TabsTrigger>
                <TabsTrigger value="objectives" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Objectives ({filteredObjectives.length})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks ({filteredTasks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="goals" className="mt-6">
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Goals Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {goals.length === 0 ? 'Get started by creating the first goal for your club.' : 'Try adjusting your filters to see more goals.'}
                    </p>
                    {canCreateGoal && goals.length === 0 && (
                      <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Goal
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredGoals.map((goal) => (
                      <Card key={goal._id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{goal.title}</h3>
                              {getStatusBadge(goal.status)}
                              {getPriorityBadge(goal.priority)}
                            </div>
                            <p className="text-muted-foreground mb-3">{goal.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Due: {new Date(goal.dueDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Owner: {goal.owner?.name || 'Unassigned'}
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Progress: {goal.calculatedProgress || goal.progress || 0}%
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewGoalDetails(goal)}
                            disabled={goalDetailsLoading}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="objectives" className="mt-6">
                {filteredObjectives.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Objectives Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {objectives.length === 0 ? 'Objectives will appear here when goals have defined objectives.' : 'Try adjusting your filters to see more objectives.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredObjectives.map((objective) => (
                      <Card key={objective._id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{objective.title}</h3>
                          {getStatusBadge(objective.status)}
                          {getPriorityBadge(objective.priority)}
                        </div>
                        <p className="text-muted-foreground mb-3">{objective.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Goal: {objective.goal?.title || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(objective.dueDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Progress: {objective.progress || 0}%
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Tasks Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tasks.length === 0 ? 'Tasks will appear here when objectives have defined tasks.' : 'Try adjusting your filters to see more tasks.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <Card key={task._id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                        <p className="text-muted-foreground mb-3">{task.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.goal && (
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              Goal: {task.goal.title}
                            </div>
                          )}
                          {task.objective && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              Objective: {task.objective.title}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Assignees: {task.assignedTo?.length || 0}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      {/* Goal Details Dialog */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Goal Details
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGoal(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold">{selectedGoal.title}</h2>
                  {getStatusBadge(selectedGoal.status)}
                  {getPriorityBadge(selectedGoal.priority)}
                </div>
                <p className="text-muted-foreground">{selectedGoal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Goal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <Badge variant="outline">{selectedGoal.format}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{selectedGoal.calculatedProgress || selectedGoal.progress || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{new Date(selectedGoal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span>{selectedGoal.owner?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Analytics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Objectives:</span>
                      <span>{selectedGoal.objectives?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasks:</span>
                      <span>{selectedGoal.tasks?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overdue:</span>
                      <span className={selectedGoal.isOverdue ? 'text-red-600' : 'text-green-600'}>
                        {selectedGoal.isOverdue ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days Remaining:</span>
                      <span>{selectedGoal.daysRemaining || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedGoal.objectives && selectedGoal.objectives.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Linked Objectives</h3>
                  <div className="space-y-2">
                    {selectedGoal.objectives.map((obj: any) => (
                      <div key={obj._id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{obj.title}</span>
                          {getStatusBadge(obj.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{obj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedGoal.tasks && selectedGoal.tasks.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Linked Tasks</h3>
                  <div className="space-y-2">
                    {selectedGoal.tasks.map((task: any) => (
                      <div key={task._id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{task.title}</span>
                          {getStatusBadge(task.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
