import { useState } from 'react';
import { Goal } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Target } from 'lucide-react';
import { CreateGoalForm } from '../forms/CreateGoalForm';
import { toast } from 'sonner';

interface ClubGoalsProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
  goals: Goal[];
}

export const ClubGoals = ({ 
  clubId, 
  currentUserRole, 
  goals = [] 
}: ClubGoalsProps) => {
  const [localGoals, setLocalGoals] = useState<Goal[]>(goals);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreateGoal = currentUserRole === 'admin' || currentUserRole === 'owner';

  const handleCreationSuccess = (newGoal: Goal) => {
    setLocalGoals(prev => [...prev, newGoal]);
    toast.success('Goal created successfully!');
    setIsCreateModalOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Goals & Objectives</CardTitle>
          <CardDescription>The strategic aims of the club.</CardDescription>
        </div>
        {canCreateGoal && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a New Goal</DialogTitle>
                <DialogDescription>
                  Define a new objective for the club members to work towards.
                </DialogDescription>
              </DialogHeader>
              <CreateGoalForm
                clubId={clubId}
                onSuccess={handleCreationSuccess}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

      </CardHeader>
      <CardContent>
        {localGoals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Target className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Goals Defined</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating the first goal for your club.</p>
            {canCreateGoal && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {localGoals.map((goal) => (
              <div key={goal._id} className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-primary">{goal.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
