import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Mail, 
  Shield, 
  Bell, 
  Users, 
  Server,
  Download,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxClubsPerUser: number;
  maxMembersPerClub: number;
  enableNotifications: boolean;
  maintenanceMode: boolean;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Harambee Hub',
    siteDescription: 'A collaborative task management platform for communities',
    allowRegistration: true,
    requireEmailVerification: false,
    maxClubsPerUser: 10,
    maxMembersPerClub: 100,
    enableNotifications: true,
    maintenanceMode: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    totalTasks: 0,
    storageUsed: '2.4 GB',
    lastBackup: '2 hours ago'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Load system settings and stats
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    try {
      const response = await apiClient.get('/admin/settings');
      const data = response.data;
      
      // Update settings from backend
      setSettings(data.settings);
      
      // Update stats from real system info
      setStats({
        totalUsers: data.systemInfo.totalUsers,
        totalClubs: data.systemInfo.totalClubs,
        totalTasks: data.systemInfo.totalTasks,
        storageUsed: data.systemInfo.storageUsed,
        lastBackup: new Date(data.systemInfo.lastBackup).toLocaleString()
      });
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system settings',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await apiClient.put('/admin/settings', settings);
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/backup');
      const data = response.data;
      
      toast({
        title: 'Success',
        description: data.message,
      });
      
      setStats(prev => ({ ...prev, lastBackup: 'Just now' }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to backup database',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/admin/cache/clear');
      const data = response.data;
      
      toast({
        title: 'Success',
        description: data.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxClubsPerUser">Max Clubs per User</Label>
                  <Input
                    id="maxClubsPerUser"
                    type="number"
                    value={settings.maxClubsPerUser}
                    onChange={(e) => setSettings({ ...settings, maxClubsPerUser: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to users
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must verify their email before accessing the platform
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Input placeholder="24 hours" disabled />
                <p className="text-sm text-muted-foreground">
                  How long users stay logged in (coming soon)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Password Requirements</Label>
                <div className="space-y-2">
                  <Badge variant="outline">Minimum 8 characters</Badge>
                  <Badge variant="outline">At least 1 uppercase letter</Badge>
                  <Badge variant="outline">At least 1 number</Badge>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Users:</span>
                    <span className="text-sm">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Clubs:</span>
                    <span className="text-sm">{stats.totalClubs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Tasks:</span>
                    <span className="text-sm">{stats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Storage Used:</span>
                    <span className="text-sm">{stats.storageUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Last Backup:</span>
                    <span className="text-sm">{stats.lastBackup}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleBackupDatabase} 
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {loading ? 'Creating Backup...' : 'Backup Database'}
                </Button>
                
                <Button 
                  variant="outline" 
                  disabled 
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Restore Database
                </Button>
                
                <Button 
                  onClick={handleClearCache}
                  disabled={loading}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {loading ? 'Clearing...' : 'Clear Cache'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Control system maintenance and user access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable user access for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>

              {settings.maintenanceMode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Maintenance mode is enabled. Users will see a maintenance page.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">System Logs</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Access Logs
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Old Logs
                  </Button>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={loading}>
                {loading ? 'Saving...' : 'Save Maintenance Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
