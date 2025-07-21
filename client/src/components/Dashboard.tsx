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
  RefreshCw,
  Bell
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserStats, fetchRecentTasks, fetchUserClubs, fetchNotifications, Task, Club, UserStats, Notification } from "@/api";
import Navbar from "@/components/Navbar";
import { VariantProps } from "class-variance-authority";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, tasks, userClubs, userNotifications] = await Promise.all([
        fetchUserStats(),
        fetchRecentTasks(),
        fetchUserClubs(),
        fetchNotifications(),
      ]);
      
      // Use stats from API or calculate from tasks
      const calculatedStats: UserStats = {
        totalTasks: stats?.totalTasks || tasks?.length || 0,
        completedTasks: stats?.completedTasks || tasks?.filter(task => task.status === 'completed')?.length || 0,
        clubs: stats?.clubs || userClubs?.length || 0,
        points: stats?.points || 0,
        pendingTasks: stats?.pendingTasks || tasks?.filter(task => task.status === 'pending')?.length || 0,
        inProgressTasks: stats?.inProgressTasks || tasks?.filter(task => task.status === 'in-progress')?.length || 0
      };
      
      setUserStats(calculatedStats);
      setRecentTasks(tasks || []);
      setClubs(userClubs || []);
      setNotifications(userNotifications || []);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats and Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalTasks}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{userStats.completedTasks}</div>
                  <p className="text-xs text-muted-foreground">Tasks done</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{userStats.inProgressTasks}</div>
                  <p className="text-xs text-muted-foreground">Active tasks</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Points</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{userStats.points}</div>
                  <p className="text-xs text-muted-foreground">Total earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Get things done faster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={handleCreateTask}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Plus className="h-6 w-6" />
                    <span>Create Task</span>
                  </Button>
                  <Button 
                    onClick={() => navigate('/clubs')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span>Browse Clubs</span>
                  </Button>
                  <Button 
                    onClick={() => navigate('/discover')}
                    className="h-20 flex flex-col items-center justify-center gap-2"
                    variant="outline"
                  >
                    <Star className="h-6 w-6" />
                    <span>Discover</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tasks */}
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
            <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">{userStats.points}</div>
                  <div className="text-sm opacity-90">Points Earned</div>
                  <Progress 
                    value={userStats.totalTasks > 0 ? (userStats.completedTasks / userStats.totalTasks) * 100 : 0} 
                    className="mt-4" 
                  />
                  <div className="text-sm opacity-90">
                    {userStats.totalTasks > 0 ? Math.round((userStats.completedTasks / userStats.totalTasks) * 100) : 0}% completion rate
                  </div>
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

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div 
                      key={notification._id} 
                      className={`p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                      }`}
                      onClick={() => {
                        if (notification.link) {
                          navigate(notification.link);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                )}
                {notifications && notifications.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/notifications')}
                  >
                    View all notifications
                  </Button>
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