import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from 'react-router-dom';
import { Club } from '@/api';
import { Users, Plus, ArrowRight, Target } from 'lucide-react';

interface ClubCardProps {
  club: Club;
  onJoin?: (clubId: string) => void;
  onManage?: (clubId: string) => void;
  isOwner?: boolean;
  showActions?: boolean;
}

const ClubCard = ({ club, onJoin, onManage, isOwner, showActions = true }: ClubCardProps) => {
  const members = club.members || [];
  const navigate = useNavigate();

  const handleCreateTask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/clubs/${club._id}/tasks/new`);
  };

  const handleViewClub = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/clubs/${club._id}`);
  };

  return (
    <Link to={`/clubs/${club._id}`} className="block group">
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-1">{club.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {club.description || 'No description provided'}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">
              {club.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2 flex-grow">
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <Users className="h-4 w-4 mr-1.5" />
            <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
          </div>
          
          {club.communities && club.communities.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <Users className="h-4 w-4 mr-1.5" />
              <span>{club.communities.length} {club.communities.length === 1 ? 'community' : 'communities'}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Target className="h-4 w-4 mr-1.5" />
            <span>Owned by {typeof club.createdBy === 'object' ? club.createdBy.name : 'Unknown'}</span>
          </div>
        </CardContent>
        
        {(showActions || isOwner) && (
          <CardFooter className="pt-2 pb-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleViewClub}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              View Club
            </Button>
            {isOwner && (
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={handleCreateTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};

export default ClubCard;
