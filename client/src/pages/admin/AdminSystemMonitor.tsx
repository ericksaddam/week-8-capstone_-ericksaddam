import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  HardDrive, 
  MemoryStick,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    incoming: number;
    outgoing: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
  };
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
  requests: number;
}

export const AdminSystemMonitor = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 45, cores: 4, temperature: 65 },
    memory: { used: 6.2, total: 16, percentage: 38.75 },
    disk: { used: 120, total: 500, percentage: 24 },
    network: { incoming: 1.2, outgoing: 0.8 },
    database: { connections: 15, maxConnections: 100, queryTime: 12 },
    api: { requestsPerMinute: 245, averageResponseTime: 120, errorRate: 0.5 }
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const generatePerformanceData = () => {
    const data: PerformanceData[] = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60000); // Every minute
      data.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.random() * 30 + 20, // 20-50%
        memory: Math.random() * 20 + 30, // 30-50%
        responseTime: Math.random() * 50 + 100, // 100-150ms
        requests: Math.random() * 100 + 200 // 200-300 requests
      });
    }
    
    return data;
  };

  const refreshMetrics = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate new random metrics (in a real app, this would come from your monitoring API)
    setMetrics({
      cpu: { 
        usage: Math.random() * 30 + 20, 
        cores: 4, 
        temperature: Math.random() * 20 + 50 
      },
      memory: { 
        used: Math.random() * 4 + 4, 
        total: 16, 
        percentage: 0 
      },
      disk: { 
        used: Math.random() * 50 + 100, 
        total: 500, 
        percentage: 0 
      },
      network: { 
        incoming: Math.random() * 2 + 0.5, 
        outgoing: Math.random() * 1.5 + 0.3 
      },
      database: { 
        connections: Math.floor(Math.random() * 20) + 10, 
        maxConnections: 100, 
        queryTime: Math.random() * 20 + 5 
      },
      api: { 
        requestsPerMinute: Math.floor(Math.random() * 100) + 200, 
        averageResponseTime: Math.random() * 50 + 100, 
        errorRate: Math.random() * 2 
      }
    });
    
    // Calculate percentages
    setMetrics(prev => ({
      ...prev,
      memory: {
        ...prev.memory,
        percentage: (prev.memory.used / prev.memory.total) * 100
      },
      disk: {
        ...prev.disk,
        percentage: (prev.disk.used / prev.disk.total) * 100
      }
    }));
    
    setPerformanceData(generatePerformanceData());
    setLastUpdate(new Date());
    setLoading(false);
    
    toast.success('System metrics updated');
  };

  useEffect(() => {
    setPerformanceData(generatePerformanceData());
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (value >= thresholds.warning) {
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Monitor</h2>
          <p className="text-muted-foreground">
            Real-time system performance and health monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <Button onClick={refreshMetrics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(metrics.cpu.usage, { warning: 70, critical: 90 })}`}>
                  {metrics.cpu.usage.toFixed(1)}%
                </div>
                {getStatusBadge(metrics.cpu.usage, { warning: 70, critical: 90 })}
              </div>
              <Progress value={metrics.cpu.usage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.cpu.cores} cores • {metrics.cpu.temperature}°C
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(metrics.memory.percentage, { warning: 80, critical: 95 })}`}>
                  {metrics.memory.percentage.toFixed(1)}%
                </div>
                {getStatusBadge(metrics.memory.percentage, { warning: 80, critical: 95 })}
              </div>
              <Progress value={metrics.memory.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.memory.used.toFixed(1)} GB / {metrics.memory.total} GB
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(metrics.disk.percentage, { warning: 80, critical: 95 })}`}>
                  {metrics.disk.percentage.toFixed(1)}%
                </div>
                {getStatusBadge(metrics.disk.percentage, { warning: 80, critical: 95 })}
              </div>
              <Progress value={metrics.disk.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {metrics.disk.used} GB / {metrics.disk.total} GB
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${getStatusColor(metrics.api.errorRate, { warning: 1, critical: 5 })}`}>
                  {metrics.api.errorRate.toFixed(1)}%
                </div>
                {getStatusBadge(metrics.api.errorRate, { warning: 1, critical: 5 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.api.requestsPerMinute} req/min • {metrics.api.averageResponseTime}ms avg
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#8884d8" 
                  name="CPU %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="memory" 
                  stroke="#82ca9d" 
                  name="Memory %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.3}
                  name="Response Time (ms)"
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  fillOpacity={0.3}
                  name="Requests/min"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Connections</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{metrics.database.connections}/{metrics.database.maxConnections}</span>
                <Progress 
                  value={(metrics.database.connections / metrics.database.maxConnections) * 100} 
                  className="w-20 h-2" 
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Query Time</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${getStatusColor(metrics.database.queryTime, { warning: 50, critical: 100 })}`}>
                  {metrics.database.queryTime.toFixed(1)}ms
                </span>
                {getStatusBadge(metrics.database.queryTime, { warning: 50, critical: 100 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Network Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Incoming Traffic</span>
              <span className="text-sm font-mono">
                {metrics.network.incoming.toFixed(2)} MB/s
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Outgoing Traffic</span>
              <span className="text-sm font-mono">
                {metrics.network.outgoing.toFixed(2)} MB/s
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Bandwidth</span>
              <span className="text-sm font-mono">
                {(metrics.network.incoming + metrics.network.outgoing).toFixed(2)} MB/s
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSystemMonitor;
