import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserManagement from "./AdminUserManagement";
import { AdminClubManagement } from './AdminClubManagement';
import AdminRequestManagement from './AdminRequestManagement';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminSettings } from './AdminSettings';
import AdminActivityLogs from './AdminActivityLogs';
import AdminNotifications from './AdminNotifications';
import AdminAnalytics from './AdminAnalytics';
import AdminSystemMonitor from './AdminSystemMonitor';
import AdminTaskManagement from './AdminTaskManagement';

export const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-6 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your application's users, clubs, and system settings
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="monitor">System Monitor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminDashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <AdminRequestManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="clubs">
          <AdminClubManagement />
        </TabsContent>

        <TabsContent value="tasks">
          <AdminTaskManagement />
        </TabsContent>

        <TabsContent value="activity">
          <AdminActivityLogs />
        </TabsContent>

        <TabsContent value="notifications">
          <AdminNotifications />
        </TabsContent>

        <TabsContent value="monitor">
          <AdminSystemMonitor />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
