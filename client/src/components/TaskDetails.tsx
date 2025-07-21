import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTaskDetails, 
  addTaskComment, 
  addTaskTimeLog, 
  toggleTaskChecklistItem, 
  updateTaskProgress,
  Task,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG
} from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  CheckSquare, 
  Timer, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Circle,
  ArrowLeft,
  Plus,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';

interface TaskDetailsProps {
  taskId?: string;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId: propTaskId }) => {
  const { taskId: paramTaskId } = useParams<{ taskId: string }>();
  const taskId = propTaskId || paramTaskId;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [newComment, setNewComment] = useState('');
  const [timeLogHours, setTimeLogHours] = useState('');
  const [timeLogDescription, setTimeLogDescription] = useState('');
  const [progressValue, setProgressValue] = useState(0);
  
  // Loading states
  const [commentLoading, setCommentLoading] = useState(false);
  const [timeLogLoading, setTimeLogLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskDetails();
    }
  }, [taskId]);

  const loadTaskDetails = async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    try {
      const taskData = await getTaskDetails(taskId);
      setTask(taskData);
      setProgressValue(taskData.progress);
    } catch (err) {
      console.error('Error loading task details:', err);
      setError('Failed to load task details');
      toast({
        title: 'Error',
        description: 'Failed to load task details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    
    setCommentLoading(true);
    try {
      await addTaskComment(task._id, newComment.trim());
      setNewComment('');
      await loadTaskDetails(); // Reload to get updated comments
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully'
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddTimeLog = async () => {
    if (!task || !timeLogHours || parseFloat(timeLogHours) <= 0) return;
    
    setTimeLogLoading(true);
    try {
      await addTaskTimeLog(task._id, parseFloat(timeLogHours), timeLogDescription);
      setTimeLogHours('');
      setTimeLogDescription('');
      await loadTaskDetails(); // Reload to get updated time logs
      toast({
        title: 'Time logged',
        description: `${timeLogHours} hours logged successfully`
      });
    } catch (err) {
      console.error('Error adding time log:', err);
      toast({
        title: 'Error',
        description: 'Failed to log time',
        variant: 'destructive'
      });
    } finally {
      setTimeLogLoading(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!task) return;
    
    try {
      const result = await toggleTaskChecklistItem(task._id, itemId);
      await loadTaskDetails(); // Reload to get updated checklist and progress
      toast({
        title: 'Checklist updated',
        description: 'Checklist item toggled successfully'
      });
    } catch (err) {
      console.error('Error toggling checklist item:', err);
      toast({
        title: 'Error',
        description: 'Failed to update checklist item',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateProgress = async () => {
    if (!task) return;
    
    setProgressLoading(true);
    try {
      await updateTaskProgress(task._id, progressValue);
      await loadTaskDetails(); // Reload to get updated progress and status
      toast({
        title: 'Progress updated',
        description: `Task progress updated to ${progressValue}%`
      });
    } catch (err) {
      console.error('Error updating progress:', err);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive'
      });
    } finally {
      setProgressLoading(false);
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const config = TASK_STATUS_CONFIG[status];
    return (
      <Badge className={`${config.bgColor} ${config.textColor}`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    const config = TASK_PRIORITY_CONFIG[priority];
    return (
      <Badge className={`${config.bgColor} ${config.textColor}`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive">{error || 'Task not found'}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">
              {task.type === 'club' ? `Club Task - ${task.club?.name}` : 'Personal Task'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
          {task.isOverdue && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Overall Progress</span>
                  <span className="font-semibold">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="w-full" />
              </div>
              
              {task.checklist && task.checklist.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Checklist Progress</span>
                    <span className="font-semibold">{task.checklistProgress}%</span>
                  </div>
                  <Progress value={task.checklistProgress} className="w-full" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span>%</span>
                <Button 
                  onClick={handleUpdateProgress}
                  disabled={progressLoading}
                  size="sm"
                >
                  {progressLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for detailed content */}
          <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="time-log">Time Log</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            {/* Checklist Tab */}
            <TabsContent value="checklist">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2" />
                    Checklist ({task.checklist?.filter(item => item.completed).length || 0}/{task.checklist?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {task.checklist && task.checklist.length > 0 ? (
                    <div className="space-y-2">
                      {task.checklist.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
                          <button
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex-shrink-0"
                          >
                            {item.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                            {item.text}
                          </span>
                          {item.completed && item.completedBy && (
                            <div className="flex items-center text-sm text-muted-foreground ml-auto">
                              <User className="h-3 w-3 mr-1" />
                              {item.completedBy.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No checklist items</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments ({task.comments?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Comment */}
                  <div className="space-y-2">
                    <Label>Add Comment</Label>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={commentLoading || !newComment.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {commentLoading ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </div>

                  <Separator />

                  {/* Comments List */}
                  {task.comments && task.comments.length > 0 ? (
                    <div className="space-y-4">
                      {task.comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.author.avatar} />
                            <AvatarFallback>
                              {comment.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{comment.author.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No comments yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time Log Tab */}
            <TabsContent value="time-log">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Timer className="h-5 w-5 mr-2" />
                    Time Log ({task.totalTimeLogged || 0}h total)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Time Log */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="2.5"
                        value={timeLogHours}
                        onChange={(e) => setTimeLogHours(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Input
                        placeholder="What did you work on?"
                        value={timeLogDescription}
                        onChange={(e) => setTimeLogDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddTimeLog}
                    disabled={timeLogLoading || !timeLogHours}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {timeLogLoading ? 'Logging...' : 'Log Time'}
                  </Button>

                  <Separator />

                  {/* Time Log List */}
                  {task.timeLog && task.timeLog.length > 0 ? (
                    <div className="space-y-3">
                      {task.timeLog.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded border">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={entry.user.avatar} />
                              <AvatarFallback>
                                {entry.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{entry.user.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {format(new Date(entry.date), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-sm text-muted-foreground">{entry.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{entry.hours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No time logged yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments ({task.attachments?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {task.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-2 rounded border">
                          <div>
                            <span className="font-medium">{attachment.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Uploaded by {attachment.uploadedBy.name} on {format(new Date(attachment.uploadedAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No attachments</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created by</span>
                  <span className="font-medium">{task.createdBy.name}</span>
                </div>

                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Assigned to</span>
                    <div className="flex flex-wrap gap-1">
                      {task.assignedTo.map((user) => (
                        <Badge key={user._id} variant="secondary">
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created</span>
                  <span className="font-medium">
                    {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Due</span>
                    <span className={`font-medium ${task.isOverdue ? 'text-destructive' : ''}`}>
                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    </span>
                    {task.daysUntilDue !== null && (
                      <span className="text-sm text-muted-foreground">
                        ({task.daysUntilDue > 0 ? `${task.daysUntilDue} days left` : 
                          task.daysUntilDue === 0 ? 'Due today' : 
                          `${Math.abs(task.daysUntilDue)} days overdue`})
                      </span>
                    )}
                  </div>
                )}

                {task.completedDate && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Completed</span>
                    <span className="font-medium">
                      {format(new Date(task.completedDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Estimated</span>
                <span className="font-medium">{task.estimatedHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Actual</span>
                <span className="font-medium">{task.actualHours}h</span>
              </div>
              {task.estimatedVsActual && (
                <div className="flex justify-between">
                  <span className="text-sm">Variance</span>
                  <span className={`font-medium ${
                    task.estimatedVsActual.variance > 0 ? 'text-destructive' : 'text-green-600'
                  }`}>
                    {task.estimatedVsActual.variance > 0 ? '+' : ''}{task.estimatedVsActual.variance}h
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
