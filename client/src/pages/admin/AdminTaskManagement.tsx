import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

const AdminTaskManagement: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Statistics
  const [stats, setStats] = useState({
    totalGoals: 0,
    totalObjectives: 0,
    totalTasks: 0,
    completedGoals: 0,
    completedObjectives: 0,
    completedTasks: 0,
    overdueItems: 0,
    activeClubs: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedClub]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch clubs first
      const clubsResponse = await fetch('/api/admin/clubs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        setClubs(clubsData.clubs || []);
      }

      // Fetch goals, objectives, and tasks for all clubs or selected club
      let allGoals: Goal[] = [];
      let allObjectives: Objective[] = [];
      let allTasks: Task[] = [];

      const clubsToFetch = selectedClub === 'all' 
        ? clubs.map(club => club._id)
        : [selectedClub];

      for (const clubId of clubsToFetch) {
        if (!clubId) continue;

        // Fetch goals
        const goalsResponse = await fetch(`/api/clubs/${clubId}/goals`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json();
          allGoals = [...allGoals, ...(goalsData.goals || [])];

          // Fetch objectives for each goal
          for (const goal of goalsData.goals || []) {
            const objectivesResponse = await fetch(`/api/goals/${goal._id}/objectives`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            if (objectivesResponse.ok) {
              const objectivesData = await objectivesResponse.json();
              allObjectives = [...allObjectives, ...(objectivesData.objectives || [])];
            }
          }
        }

        // Fetch tasks
        const tasksResponse = await fetch(`/api/clubs/${clubId}/tasks`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          allTasks = [...allTasks, ...(tasksData.tasks || [])];
        }
      }

      setGoals(allGoals);
      setObjectives(allObjectives);
      setTasks(allTasks);

      // Calculate statistics
      calculateStats(allGoals, allObjectives, allTasks);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch task management data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (goals: Goal[], objectives: Objective[], tasks: Task[]) => {
    const now = new Date();
    
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const completedObjectives = objectives.filter(o => o.status === 'completed').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const overdueItems = [
      ...goals.filter(g => g.dueDate && new Date(g.dueDate) < now && g.status !== 'completed'),
      ...objectives.filter(o => o.dueDate && new Date(o.dueDate) < now && o.status !== 'completed'),
      ...tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed')
    ].length;

    const activeClubs = new Set([
      ...goals.map(g => g.club._id),
      ...objectives.map(o => o.goal ? clubs.find(c => goals.find(g => g._id === o.goal._id)?.club._id === c._id)?._id : null),
      ...tasks.map(t => t.club._id)
    ].filter(Boolean)).size;

    setStats({
      totalGoals: goals.length,
      totalObjectives: objectives.length,
      totalTasks: tasks.length,
      completedGoals,
      completedObjectives,
      completedTasks,
      overdueItems,
      activeClubs
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      active: "default",
      in_progress: "default",
      todo: "secondary",
      on_hold: "secondary",
      review: "secondary",
      completed: "default",
      cancelled: "destructive"
    };

    const colors: Record<string, string> = {
      draft: "text-gray-600",
      active: "text-blue-600",
      in_progress: "text-blue-600",
      todo: "text-gray-600",
      on_hold: "text-yellow-600",
      review: "text-purple-600",
      completed: "text-green-600",
      cancelled: "text-red-600"
    };

    return (
      <Badge variant={variants[status] || "outline"} className={colors[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600 bg-green-50",
      medium: "text-yellow-600 bg-yellow-50",
      high: "text-orange-600 bg-orange-50",
      critical: "text-red-600 bg-red-50"
    };

    return (
      <Badge variant="outline" className={colors[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedGoals} completed ({stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedObjectives} completed ({stats.totalObjectives > 0 ? Math.round((stats.completedObjectives / stats.totalObjectives) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed ({stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueItems}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.activeClubs} active clubs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
          <CardDescription>
            Manage goals, objectives, and tasks across all clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search goals, objectives, or tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map((club) => (
                  <SelectItem key={club._id} value={club._id}>
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
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

          <Tabs defaultValue="goals" className="space-y-4">
            <TabsList>
              <TabsTrigger value="goals">Goals ({filteredGoals.length})</TabsTrigger>
              <TabsTrigger value="objectives">Objectives ({filteredObjectives.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({filteredTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4">
              <div className="space-y-4">
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No goals found matching your criteria
                  </div>
                ) : (
                  filteredGoals.map((goal) => (
                    <Card key={goal._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{goal.title}</h3>
                              <Badge variant="outline">{goal.format}</Badge>
                              {getStatusBadge(goal.status)}
                              {getPriorityBadge(goal.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {goal.club.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatDate(goal.dueDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {goal.progress}% complete
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{goal.owner.name}</div>
                            <div className="text-xs text-muted-foreground">Owner</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-4">
              <div className="space-y-4">
                {filteredObjectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No objectives found matching your criteria
                  </div>
                ) : (
                  filteredObjectives.map((objective) => (
                    <Card key={objective._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{objective.title}</h3>
                              {getStatusBadge(objective.status)}
                              {getPriorityBadge(objective.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{objective.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Goal: {objective.goal.title}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatDate(objective.dueDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {objective.progress}% complete
                              </span>
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {objective.keyResults.length} key results
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks found matching your criteria
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <Card key={task._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{task.title}</h3>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.club.name}
                              </span>
                              {task.goal && (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  Goal: {task.goal.title}
                                </span>
                              )}
                              {task.objective && (
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  Objective: {task.objective.title}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {formatDate(task.dueDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {task.progress}% complete
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {task.assignedTo.length} assigned
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaskManagement;
