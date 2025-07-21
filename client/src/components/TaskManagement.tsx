import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, Search, Loader2, AlertCircle, Target, Eye, X, Calendar, Users, TrendingUp, BarChart3, CheckSquare } from "lucide-react";
import TaskCard from "./TaskCard";
import TaskDetails from "./TaskDetails";
import { CreateTaskForm } from "./forms/CreateTaskForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchTasks, createTask, updateTask, deleteTask, Task, UpdateTaskData } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Goal interface
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

export const TaskManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [mainTab, setMainTab] = useState("goals");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalDetailsLoading, setGoalDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks = await fetchTasks();
      setTasks(tasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again later.');
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadGoals = useCallback(async () => {
    try {
      // Get user's clubs first
      const clubsResponse = await fetch('/api/clubs/my-clubs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        const userClubs = clubsData.clubs || [];
        
        // Fetch goals from all user's clubs
        let allGoals: Goal[] = [];
        for (const club of userClubs) {
          const goalsResponse = await fetch(`/api/clubs/${club._id}/goals`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (goalsResponse.ok) {
            const goalsData = await goalsResponse.json();
            allGoals = [...allGoals, ...(goalsData.goals || [])];
          }
        }
        
        setGoals(allGoals);
      }
    } catch (err) {
      console.error('Error loading goals:', err);
      toast({
        title: "Error",
        description: "Failed to load goals. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchGoalDetails = async (goalId: string) => {
    try {
      setGoalDetailsLoading(true);
      const response = await fetch(`/api/goals/${goalId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedGoal(data.goal);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch goal details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching goal details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goal details.",
        variant: "destructive",
      });
    } finally {
      setGoalDetailsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    loadGoals();
  }, [loadTasks, loadGoals]);

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    setActionLoading(true);
    try {
      const created = await createTask(taskData);
      
      // Add null check for created task
      if (!created || !created.title) {
        throw new Error('Invalid task data returned from server');
      }
      
      setTasks(prev => [...prev, created]);
      setIsCreateModalOpen(false);
      toast({ 
        title: "Task created",
        description: `${created.title} has been created successfully.`
      });
    } catch (err) {
      console.error('Error creating task:', err);
      toast({ 
        title: "Failed to create task", 
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive" 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updates: UpdateTaskData = { status: newStatus };
      const updated = await updateTask(taskId, updates);
      setTasks(prev => prev.map(task => task._id === taskId ? updated : task));
      toast({ 
        title: "Status updated",
        description: `Task marked as ${newStatus.replace('-', ' ')}.`
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      toast({ 
        title: "Failed to update task", 
        description: 'Could not update task status. Please try again.',
        variant: "destructive" 
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(task => task._id !== taskId));
      toast({ 
        title: "Task deleted",
        description: "The task has been successfully deleted."
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      toast({ 
        title: "Failed to delete task", 
        description: 'Could not delete the task. Please try again.',
        variant: "destructive" 
      });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const filteredTasks = tasks.filter(task => {
    // Add null check for task
    if (!task || !task.title) return false;
    
    const matchesTab = activeTab === "all" || task.status === activeTab;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesTab && matchesSearch && matchesPriority;
  });

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      "in-progress": tasks.filter(t => t.status === "in-progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      archived: tasks.filter(t => t.status === "archived").length,
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "outline" as const, label: "Draft" },
      active: { variant: "default" as const, label: "Active" },
      on_hold: { variant: "secondary" as const, label: "On Hold" },
      completed: { variant: "default" as const, label: "Completed", className: "bg-green-500" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "outline" as const, label: "Low" },
      medium: { variant: "secondary" as const, label: "Medium" },
      high: { variant: "default" as const, label: "High", className: "bg-orange-500" },
      critical: { variant: "destructive" as const, label: "Critical" },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
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

  const counts = getTaskCounts();

  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Error loading tasks</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadTasks} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            'Retry'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Task Management</h2>
          <p className="text-muted-foreground">Manage and track all your tasks</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2 opacity-50" />
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full overflow-x-auto flex">
          <TabsTrigger value="all" className="flex items-center space-x-2 flex-shrink-0">
            <span>All</span>
            <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-2 flex-shrink-0">
            <span>Pending</span>
            <Badge variant="secondary" className="ml-1">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center space-x-2 flex-shrink-0">
            <span>In Progress</span>
            <Badge variant="secondary" className="ml-1">{counts["in-progress"]}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2 flex-shrink-0">
            <span>Completed</span>
            <Badge variant="secondary" className="ml-1">{counts.completed}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center space-x-2 flex-shrink-0">
            <span>Archived</span>
            <Badge variant="secondary" className="ml-1">{counts.archived}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === "all" 
                  ? "Create your first task to get started" 
                  : `No ${activeTab.replace('-', ' ')} tasks at the moment`}
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleTaskDelete}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <CreateTaskForm
            onSuccess={(task) => {
              handleTaskCreate(task);
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskDetails 
              taskId={selectedTask._id} 
              onClose={() => setIsTaskDetailsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};