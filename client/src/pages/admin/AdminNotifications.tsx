import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users, BarChart, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
}

export const AdminNotifications = () => {
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    unreadNotifications: 0,
    readNotifications: 0
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [targetUsers, setTargetUsers] = useState('all');

  const fetchNotificationStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/notifications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      toast.error('Failed to load notification statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationStats();
  }, []);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please provide both title and message');
      return;
    }

    try {
      setSending(true);
      const response = await apiClient.post('/admin/notifications/send', {
        title: title.trim(),
        message: message.trim(),
        type,
        targetUsers
      });

      toast.success(response.data.message);
      
      // Reset form
      setTitle('');
      setMessage('');
      setType('info');
      setTargetUsers('all');
      
      // Refresh stats
      fetchNotificationStats();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error(error.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (notificationType: string) => {
    switch (notificationType) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeBadgeColor = (notificationType: string) => {
    switch (notificationType) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Management</h2>
          <p className="text-muted-foreground">
            Send system-wide notifications and manage notification statistics
          </p>
        </div>
        <Button onClick={fetchNotificationStats} variant="outline" size="sm" disabled={loading}>
          <BarChart className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {/* Notification Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            <p className="text-xs text-muted-foreground">
              All notifications sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Pending user attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read Notifications</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.readNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send System Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      Information
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Error
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Enter your notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Users</label>
            <Select value={targetUsers} onValueChange={setTargetUsers}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Users
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  {getTypeIcon(type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{title || 'Notification Title'}</h4>
                      <Badge className={getTypeBadgeColor(type)}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {message || 'Notification message will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSendNotification}
              disabled={sending || !title.trim() || !message.trim()}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotifications;
