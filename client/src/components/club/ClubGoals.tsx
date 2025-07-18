import { useState, useEffect } from 'react';
import { Goal } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Target, RefreshCw, AlertCircle } from 'lucide-react';
import { CreateGoalForm } from '../forms/CreateGoalForm';
import { toast } from 'sonner';
import { fetchClubGoals } from '@/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ClubGoalsProps {
  clubId: string;
  currentUserRole?: 'member' | 'admin' | 'owner';
}

export const ClubGoals = ({ 
  clubId, 
  currentUserRole
}: ClubGoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const canCreateGoal = currentUserRole === 'admin' || currentUserRole === 'owner';

  if (!clubId) {
    console.error('Club ID is missing in ClubGoals component');
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Club ID is missing. Cannot load goals.
        </AlertDescription>
      </Alert>
    );
  }

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGoals = await fetchClubGoals(clubId);
      setGoals(fetchedGoals);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (clubId && mounted) {
        await loadGoals();
      }
    };
    
    fetchData();
    
    return () => {
      mounted = false;
    };
  }, [clubId]);

  const handleCreationSuccess = (newGoal: Goal) => {
    setGoals(prev => [...prev, newGoal]);
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
        <div className="flex gap-2">
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
          <Button size="sm" variant="outline" onClick={loadGoals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading goals...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadGoals} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : goals.length === 0 ? (
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
            {goals.filter(goal => goal && goal.title).map((goal) => (
              <div key={goal._id || goal.title} className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-primary">{goal.title ?? 'Untitled Goal'}</h4>
                <p className="text-sm text-muted-foreground mt-1">{goal.description ?? ''}</p>
                {goal.targetDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
