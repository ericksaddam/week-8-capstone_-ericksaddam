import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { adminApi, User } from '@/api/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const userFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }).optional().or(z.literal('')),
  role: z.enum(['user', 'admin']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmit: () => void;
}

export function UserForm({ open, onOpenChange, user, onSubmit }: UserFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
  }, [user, open, form]);

  const handleSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    try {
      if (isEditMode && user) {
        // For updates, only include password if it's provided
        const updateData = { ...data };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await adminApi.updateUser(user._id, updateData);
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } else {
        // For new users, password is required
        if (!data.password) {
          toast({
            title: 'Error',
            description: 'Password is required for new users',
            variant: 'destructive',
          });
          return;
        }
        
        await adminApi.createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        });
        
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
      }
      
      onOpenChange(false);
      onSubmit();
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error instanceof Error ? error.message : 'An error occurred while saving the user';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Removed mock functions since we're using the adminApi directly

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update user details below.' : 'Fill in the user details below to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              {...form.register('password')}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="role">Admin Privileges</Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {form.watch('role') === 'admin' ? 'Admin' : 'User'}
              </span>
              <Switch
                id="role"
                checked={form.watch('role') === 'admin'}
                onCheckedChange={(checked) =>
                  form.setValue('role', checked ? 'admin' : 'user')
                }
              />
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditMode ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
