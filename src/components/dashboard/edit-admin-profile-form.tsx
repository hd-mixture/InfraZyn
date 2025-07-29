
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  phone: z.string().optional(),
});

type EditAdminProfileFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentName: string;
  currentPhone: string;
};

export function EditAdminProfileForm({ isOpen, onOpenChange, currentName, currentPhone }: EditAdminProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentName,
      phone: currentPhone,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: currentName,
        phone: currentPhone,
      });
    }
  }, [isOpen, currentName, currentPhone, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        // Store in local storage as admin is not a regular DB user
        localStorage.setItem('adminName', values.name);
        if (values.phone) {
            localStorage.setItem('adminPhone', values.phone);
        } else {
            localStorage.removeItem('adminPhone');
        }

        // Dispatch storage event to notify other components like user-nav
        window.dispatchEvent(new Event('storage'));

        toast({
            title: 'Profile Updated!',
            description: 'Your admin profile has been successfully updated.',
        });
        onOpenChange(false);
    } catch (e) {
      console.error('Error updating profile: ', e);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem updating your profile.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Edit Admin Profile
          </DialogTitle>
          <DialogDescription>
            Update your administrator information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4 !justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
