
'use client';

import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, User, X, Tag, Github, Linkedin, Gitlab } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { UserProfile } from './developer-profile-view';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ALL_SKILLS } from '@/lib/skills';

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  bio: z.string().optional(),
  status: z.enum(['Active', 'On Leave']),
  skills: z.array(z.string()).optional(),
  github: z.string().url('Please enter a valid URL.').or(z.literal('')).optional(),
  linkedin: z.string().url('Please enter a valid URL.').or(z.literal('')).optional(),
  gitlab: z.string().url('Please enter a valid URL.').or(z.literal('')).optional(),
});

type EditDeveloperProfileFormProps = {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function EditDeveloperProfileForm({ user, isOpen, onOpenChange }: EditDeveloperProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || '',
      status: user.status || 'Active',
      skills: user.skills || [],
      github: user.github || '',
      linkedin: user.linkedin || '',
      gitlab: user.gitlab || '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });
  
  const skillsValue = form.watch('skills') || [];

  const filteredSkills = ALL_SKILLS.filter(skill => 
    skillInput && 
    skill.toLowerCase().includes(skillInput.toLowerCase()) && 
    !skillsValue.includes(skill)
  ).slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: user.name,
        bio: user.bio || '',
        status: user.status || 'Active',
        skills: user.skills || [],
        github: user.github || '',
        linkedin: user.linkedin || '',
        gitlab: user.gitlab || '',
      });
    }
  }, [isOpen, user, form]);
  
  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skillsValue.includes(trimmedSkill)) {
      append(trimmedSkill);
    }
    setSkillInput('');
    setIsPopoverOpen(false);
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput) {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
    if (e.key === 'Backspace' && !skillInput && skillsValue.length > 0) {
      remove(skillsValue.length - 1);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      
      const updateData: Partial<UserProfile> = {
        name: values.name,
        bio: values.bio,
        status: values.status,
        skills: values.skills,
        github: values.github,
        linkedin: values.linkedin,
        gitlab: values.gitlab,
      };

      await updateDoc(userRef, updateData);

      if (values.name !== user.name) {
          localStorage.setItem('userName', values.name);
          window.dispatchEvent(new Event('storage'));
      }

      toast({ title: 'Profile Updated!', description: 'Your profile has been successfully updated.' });
      onOpenChange(false);
    } catch (e) {
      console.error('Error updating profile: ', e);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'There was a problem updating your profile.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Edit Profile</DialogTitle>
          <DialogDescription>Update your developer profile information below.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem><FormLabel>Bio / About</FormLabel><FormControl><Textarea placeholder="Tell us a little about yourself" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Current Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Set your status" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
              
              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Skills</FormLabel>
                     <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                           <FormControl>
                            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 items-center cursor-text" onClick={() => inputRef.current?.focus()}>
                              {fields.map((field, index) => (
                                <Badge key={field.id} variant="secondary">
                                  {field.value}
                                  <button type="button" onClick={() => remove(index)} className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
                                </Badge>
                              ))}
                              <Input
                                  ref={inputRef}
                                  value={skillInput}
                                  onChange={(e) => {
                                      setSkillInput(e.target.value);
                                      if(!isPopoverOpen && e.target.value) setIsPopoverOpen(true);
                                      if(isPopoverOpen && !e.target.value) setIsPopoverOpen(false);
                                  }}
                                  onKeyDown={handleKeyDown}
                                  placeholder={skillsValue.length === 0 ? "Add a skill and press Enter" : ""}
                                  className="flex-1 h-auto p-0 border-none shadow-none focus-visible:ring-0 min-w-[150px] bg-transparent"
                                />
                            </div>
                           </FormControl>
                        </PopoverTrigger>
                         <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                           {filteredSkills.length > 0 ? (
                            <ul className="py-1">
                              {filteredSkills.map(skill => (
                                <li 
                                  key={skill}
                                  onClick={() => handleAddSkill(skill)}
                                  className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
                                >
                                  {skill}
                                </li>
                              ))}
                            </ul>
                           ) : skillInput ? (
                             <div className="p-4 text-center text-sm text-muted-foreground">No matching skill found.</div>
                           ) : null}
                         </PopoverContent>
                      </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField control={form.control} name="github" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub Profile URL</FormLabel><FormControl><Input placeholder="https://github.com/username" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="linkedin" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn Profile URL</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="gitlab" render={({ field }) => (
                <FormItem><FormLabel className="flex items-center gap-2"><Gitlab className="h-4 w-4" /> GitLab Profile URL</FormLabel><FormControl><Input placeholder="https://gitlab.com/username" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>

              <DialogFooter className="pt-4 !justify-end sticky bottom-0 bg-background/90 backdrop-blur-sm -mb-2 pb-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
