
'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
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
import { Loader2, User, X, Tag, ListChecks, ShieldCheck } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import type { UserProfile } from './qa-profile-view';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['Active', 'On Leave']),
  skills: z.array(z.string()).optional(),
  testingTools: z.array(z.string()).optional(),
});

type EditQAProfileFormProps = {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const QA_SKILLS = ["Manual Testing", "Automation Testing", "Performance Testing", "Security Testing", "API Testing", "Mobile Testing", "Web Testing"];
const QA_TOOLS = ["JIRA", "Selenium", "Cypress", "Postman", "TestRail", "Playwright", "Appium", "BrowserStack"];

export function EditQAProfileForm({ user, isOpen, onOpenChange }: EditQAProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      bio: user.bio || '',
      status: user.status || 'Active',
      skills: user.skills || [],
      testingTools: user.testingTools || [],
    },
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control: form.control, name: "skills" });
  const { fields: toolFields, append: appendTool, remove: removeTool } = useFieldArray({ control: form.control, name: "testingTools" });

  useEffect(() => {
    if (isOpen) form.reset({ ...user, phone: user.phone || '', bio: user.bio || '', skills: user.skills || [], testingTools: user.testingTools || [] });
  }, [isOpen, user, form]);

  const handleAddTag = (value: string, currentTags: string[], appendFn: (v: string) => void, setInputFn: (v: string) => void) => {
    const trimmed = value.trim();
    if (trimmed && !currentTags.includes(trimmed)) appendFn(trimmed);
    setInputFn('');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, values as any);

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
          <DialogDescription>Update your QA profile information below.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem><FormLabel>Bio / About</FormLabel><FormControl><Textarea placeholder="Tell us about your testing philosophy" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Current Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Set your status" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
              
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Testing Skills</FormLabel>
                <FormControl>
                    <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-12 items-center">
                        {skillFields.map((field, index) => (
                            <Badge key={field.id} variant="secondary">{form.getValues("skills")?.[index]}
                                <button type="button" onClick={() => removeSkill(index)} className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                         <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(skillInput, form.getValues('skills') || [], appendSkill, setSkillInput))} placeholder="Add skill..." className="flex-1 h-auto p-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] bg-transparent" />
                    </div>
                </FormControl>
                 <div className="flex flex-wrap gap-1 pt-1">{QA_SKILLS.filter(s => !form.getValues('skills')?.includes(s)).map(skill => (
                    <Button key={skill} type="button" size="sm" variant="outline" onClick={() => handleAddTag(skill, form.getValues('skills') || [], appendSkill, setSkillInput)}>{skill}</Button>
                 ))}</div>
              </FormItem>
              
               <FormItem>
                <FormLabel className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Tool Expertise</FormLabel>
                <FormControl>
                    <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-12 items-center">
                        {toolFields.map((field, index) => (
                            <Badge key={field.id} variant="outline">{form.getValues("testingTools")?.[index]}
                                <button type="button" onClick={() => removeTool(index)} className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                         <Input value={toolInput} onChange={(e) => setToolInput(e.target.value)} onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(toolInput, form.getValues('testingTools') || [], appendTool, setToolInput))} placeholder="Add tool..." className="flex-1 h-auto p-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] bg-transparent" />
                    </div>
                </FormControl>
                 <div className="flex flex-wrap gap-1 pt-1">{QA_TOOLS.filter(t => !form.getValues('testingTools')?.includes(t)).map(tool => (
                    <Button key={tool} type="button" size="sm" variant="outline" onClick={() => handleAddTag(tool, form.getValues('testingTools') || [], appendTool, setToolInput)}>{tool}</Button>
                 ))}</div>
              </FormItem>
              
              <DialogFooter className="pt-4 !justify-end sticky bottom-0 bg-background/90 backdrop-blur-sm -mb-2 pb-2">
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
