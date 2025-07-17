import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { UserPlus, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]).default("member"),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

export interface NewMember {
  id: string;
  email: string;
  role: 'member' | 'admin';
  status: 'pending';
  clubId: string;
  invitedAt: string;
}

interface AddMemberFormProps {
  clubId?: string;
  onSuccess?: (member: NewMember) => void;
  onCancel?: () => void;
}

export const AddMemberForm = ({ clubId, onSuccess, onCancel }: AddMemberFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      role: "member"
    }
  });

  const onSubmit = async (data: AddMemberFormData) => {
    setIsLoading(true);
    try {
      // Mock member invitation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMember = {
        id: Date.now().toString(),
        email: data.email,
        role: data.role,
        status: "pending",
        clubId: clubId || "default-club",
        invitedAt: new Date().toISOString(),
      };

      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${data.email}.`,
      });

      reset();
      onSuccess?.(mockMember);
    } catch (error) {
      toast({
        title: "Failed to send invitation",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Enter member's email"
            className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select onValueChange={(value) => setValue("role", value as "member" | "admin")} defaultValue="member">
          <SelectTrigger className={errors.role ? "border-destructive" : ""}>
            <SelectValue placeholder="Select member role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role.message}</p>
        )}
      </div>

      <div className="bg-muted/50 p-3 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Role Permissions:</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Member:</strong> Can view tasks, update assigned tasks, and participate in discussions</p>
          <p><strong>Admin:</strong> Can create tasks, manage members, and modify club settings</p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Send Invitation</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );
};