import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Plus,
  Award,
  Star,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserStats, fetchRecentTasks, fetchUserClubs, Task, Club } from "@/api";
import Navbar from "@/components/Navbar";
import { VariantProps } from "class-variance-authority";

interface UserStats {
  totalTasks: number;
  completedTasks: number;
  clubs: number;
  points: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, tasks, userClubs] = await Promise.all([
        fetchUserStats(),
        fetchRecentTasks(),
        fetchUserClubs(),
      ]);
      
      // Calculate actual stats from tasks if API doesn't provide them
      const calculatedStats = {
        totalTasks: tasks?.length || 0,
        completedTasks: tasks?.filter(task => task.status === 'completed')?.length || 0,
        clubs: userClubs?.length || 0,
        points: stats?.points || 0
      };
      
      setUserStats(calculatedStats);
      setRecentTasks(tasks || []);
      setClubs(userClubs || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleTaskClick = (task: Task) => {
    if (task.type === 'club' && task.club) {
      navigate(`/clubs/${task.club}`);
    } else {
      navigate('/tasks');
    }
  };

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  const handleCreateTask = () => {
    navigate('/tasks');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = () => {
    loadData();
  };

  const getPriorityColor = (priority: string): VariantProps<typeof badgeVariants>["variant"] => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "in-progress": return <Clock className="h-4 w-4 text-accent" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mb-4">
            {error}
          </AlertDescription>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <Navbar />
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your clubs.</p>
          </div>
          <Button 
            variant="gradient" 
            size="lg" 
            className="group" 
            onClick={handleCreateTask}
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Task
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="bg-gradient-primary text-white border-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{userStats?.totalTasks || 0}</div>
                <Target className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-success text-white border-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/tasks')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{userStats?.completedTasks || 0}</div>
                <CheckCircle className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-accent text-white border-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/clubs')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{userStats?.clubs || 0}</div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-warm text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Points Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{userStats?.points || 0}</div>
                <Award className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Tasks
                </CardTitle>
                <CardDescription>Your latest task activities across all clubs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentTasks && recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div 
                      key={task._id || task.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <div className="font-medium text-foreground">{task.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.type === 'club' ? `Club: ${task.club || 'Unknown'}` : 'Personal Task'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent tasks</p>
                    <p className="text-xs">Create your first task to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievement Card */}
            <Card className="bg-gradient-warm text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{userStats.rank}</div>
                  <div className="text-sm opacity-90">{userStats.streak} day streak!</div>
                  <Progress value={userStats.completionRate} className="mt-4" />
                  <div className="text-sm opacity-90">{userStats.completionRate}% completion rate</div>
                </div>
              </CardContent>
            </Card>

            {/* My Clubs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Clubs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clubs && clubs.length > 0 ? (
                  clubs.map((club) => {
                    // Safely extract member count
                    const memberCount = Array.isArray(club.members) ? club.members.length : 0;
                    // Safely extract task count
                    const taskCount = Array.isArray(club.goals) ? club.goals.length : 0;
                    // Generate a color based on club name
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                    const clubColor = colors[club.name?.length % colors.length] || 'bg-gray-500';
                    
                    return (
                      <div 
                        key={club._id} 
                        className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => handleClubClick(club._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${clubColor}`}></div>
                            <span className="font-medium text-foreground">{club.name}</span>
                          </div>
                          <Badge variant="outline">{taskCount} goals</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{memberCount} members</span>
                          <span className="text-xs">{club.status || 'Active'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {club.description || 'No description available'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No clubs joined yet</p>
                    <p className="text-xs">Join a club to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;