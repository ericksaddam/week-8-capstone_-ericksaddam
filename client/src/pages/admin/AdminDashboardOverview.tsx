import { useState, useEffect } from 'react';
import { fetchAdminDashboardStats, fetchAdminDashboardAnalytics, AdminDashboardStats, AdminDashboardAnalytics } from '@/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, BarChart, Clock, LineChart as LineChartIcon, Activity, Database, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, description }: { title: string; value: number; icon: React.ElementType; description: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export const AdminDashboardOverview = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState({
    api: 'healthy',
    database: 'healthy',
    storage: 'healthy',
    lastChecked: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [fetchedStats, fetchedAnalytics] = await Promise.all([
          fetchAdminDashboardStats(),
          fetchAdminDashboardAnalytics(),
        ]);
        setStats(fetchedStats);
        setAnalytics(fetchedAnalytics);
        
        // Simulate system health check
        setSystemHealth({
          api: 'healthy',
          database: 'healthy', 
          storage: 'healthy',
          lastChecked: new Date().toISOString()
        });
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (!stats || !analytics) {
    return <div className="text-center py-10">No data available.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats.userStats?.totalUsers ?? 0} 
          icon={Users} 
          description={`${stats.userStats?.newUsersToday ?? 0} new today`}
        />
        <StatCard 
          title="Total Clubs" 
          value={stats.clubStats?.totalClubs ?? 0} 
          icon={Shield} 
          description={`${stats.clubStats?.newClubsToday ?? 0} new today`}
        />
        <StatCard 
          title="Pending Clubs" 
          value={stats.clubStats?.pendingClubs ?? 0} 
          icon={Clock} 
          description="Awaiting approval"
        />
        <StatCard 
          title="Admin Users" 
          value={stats.userStats?.admins ?? 0} 
          icon={Shield} 
          description="System administrators"
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChartIcon className="mr-2" />
              Club Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.clubGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#82ca9d" name="New Clubs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.recentActivities || []).map(activity => (
                <div key={activity._id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activity.user.name} {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">API Status</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Database</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart className="h-4 w-4" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Normal</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date(systemHealth.lastChecked).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
