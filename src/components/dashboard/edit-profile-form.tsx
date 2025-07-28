
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Upload, User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import axios from 'axios';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.any().optional(),
});

type UserProfile = {
    id: string;
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    avatar?: string;
};

type EditProfileFormProps = {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function EditProfileForm({ user, isOpen, onOpenChange }: EditProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      bio: user.bio || '',
      avatar: null,
    },
  });
  
  const fileRef = form.register('avatar');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      let avatarUrl = user.avatar;
      if (values.avatar && values.avatar.length > 0) {
        const file = values.avatar[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        
        avatarUrl = response.data.secure_url;
      }

      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        name: values.name,
        phone: values.phone,
        bio: values.bio,
        avatar: avatarUrl,
      });

      if (values.name !== user.name) {
          localStorage.setItem('userName', values.name);
      }
      if (avatarUrl) {
          localStorage.setItem('userAvatar', avatarUrl);
      }

      // Dispatch a storage event to notify other components of the change
      window.dispatchEvent(new Event('storage'));

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been successfully updated.',
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
            <User className="w-5 h-5" /> Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
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
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio / About</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a little about yourself"
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={() => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="avatar-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Upload Image</span>
                        </label>
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          {...fileRef}
                        />
                        {form.watch('avatar')?.[0]?.name && (
                          <span className="text-sm text-muted-foreground">
                            {form.watch('avatar')[0].name}
                          </span>
                        )}
                      </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
