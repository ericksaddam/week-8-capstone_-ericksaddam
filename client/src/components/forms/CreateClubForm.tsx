import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestClubCreation, Club } from "@/api";
import { fetchUserClubRequests } from "@/api/user";
import { Badge } from "@/components/ui/badge";

const createClubSchema = z.object({
  name: z.string().min(2, "Club name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  purpose: z.string().min(20, "Purpose must be at least 20 characters long."),
});

type CreateClubFormData = z.infer<typeof createClubSchema>;

interface ClubRequest {
  _id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface CreateClubFormProps {
  onSuccess?: (club: Club) => void;
  onCancel?: () => void;
}

export const CreateClubForm = ({ onSuccess, onCancel }: CreateClubFormProps) => {
  // Club request state
  const [clubRequests, setClubRequests] = useState<ClubRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorRequests, setErrorRequests] = useState<string | null>(null);

  useEffect(() => {
    setLoadingRequests(true);
    fetchUserClubRequests()
      .then((data) => {
        setClubRequests(data);
        setErrorRequests(null);
      })
      .catch((err) => {
        setErrorRequests('Failed to load your club requests.');
      })
      .finally(() => setLoadingRequests(false));
  }, []);

  const pendingCount = clubRequests.filter(r => r.status === 'pending').length;

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateClubFormData>({
    resolver: zodResolver(createClubSchema),
  });

  const onSubmit = async (data: CreateClubFormData) => {
    setIsLoading(true);
    try {
      const response = await requestClubCreation(data);
      
      toast({
        title: "Request Submitted",
        description: "Your request to create a new club has been submitted for approval.",
      });
      
      if (onSuccess) {
        onSuccess(response.club);
      }
      reset();
    } catch (error) {
      console.error("Error requesting club creation:", error);
      const message = error instanceof Error ? error.message : "There was an error submitting your request. Please try again.";
      toast({
        title: "Error Submitting Request",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Club Requests Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Your Club Creation Requests</span>
          {pendingCount > 0 && <Badge variant="outline">{pendingCount} Pending</Badge>}
        </div>
        {loadingRequests ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : errorRequests ? (
          <div className="text-destructive text-sm">{errorRequests}</div>
        ) : clubRequests.length === 0 ? (
          <div className="text-muted-foreground text-sm">You have not requested any clubs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-4">Club Name</th>
                  <th className="text-left py-1 pr-4">Status</th>
                  <th className="text-left py-1">Approved Date</th>
                </tr>
              </thead>
              <tbody>
                {clubRequests.map((req) => (
                  <tr key={req._id || req.id} className="border-b">
                    <td className="py-1 pr-4">{req.name}</td>
                    <td className="py-1 pr-4">
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'pending' ? 'secondary' : 'destructive'}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-1">
                      {req.status === 'approved' && req.approvedAt ? new Date(req.approvedAt).toLocaleDateString() : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Club Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Drama Club, Student Council"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is this club about?"
            {...register("description")}
            className={errors.description ? "border-destructive" : ""}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="What is the main purpose or mission of this club?"
            {...register("purpose")}
            className={errors.purpose ? "border-destructive" : ""}
          />
          {errors.purpose && (
            <p className="text-sm text-destructive">{errors.purpose.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Club"}
          </Button>
        </div>
      </form>
    </>
  );
};