import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  User, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Users,
  Target,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import { Task } from "@/api";
import { VariantProps } from "class-variance-authority";
import { formatDistanceToNow, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard = ({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) => {
  const getPriorityColor = (priority: Task['priority']): VariantProps<typeof badgeVariants>["variant"] => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": 
      default: 
        return "secondary";
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case "completed": return "success";
      case "in-progress": return "default";
      case "archived": return "secondary";
      case "pending":
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "in-progress": return <Clock className="h-4 w-4" />;
      case "archived": return <Archive className="h-4 w-4" />;
      case "pending":
      default: 
        return <Target className="h-4 w-4" />;
    }
  };

  const handleStatusClick = () => {
    if (onStatusChange) {
      const nextStatus = task.status === "pending" ? "in-progress" : 
                        task.status === "in-progress" ? "completed" : 
                        task.status === "completed" ? "archived" : "pending";
      onStatusChange(task._id, nextStatus);
    }
  };

  const isOverdue = () => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== "completed" && task.status !== "archived";
  };

  const formatDueDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {task.title}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(task._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {task.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
            <Badge variant={getStatusColor(task.status)} className="text-xs">
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace('-', ' ')}</span>
            </Badge>
            {isOverdue() && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Due Date */}
        {task.dueDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Due {formatDueDate(task.dueDate)}</span>
          </div>
        )}

        {/* Assigned To */}
        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <div className="flex -space-x-2">
                {task.assignedTo.map(user => (
                  <Avatar key={user._id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {task.status === "in-progress" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2" />
          </div>
        )}

        {/* Due Date and Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{task.dueDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{task.comments}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleStatusClick}
              className={`transition-all duration-200 ${
                task.status === "completed" ? "bg-success text-success-foreground" : ""
              }`}
            >
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace("-", " ")}</span>
            </Button>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;