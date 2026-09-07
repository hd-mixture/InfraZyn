
'use client';

import { useState, useEffect, KeyboardEvent, useRef, startTransition } from 'react';
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
import { Loader2, User, X, Tag, Brush, Palette } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import type { UserProfile } from './designer-profile-view';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ALL_SKILLS } from '@/lib/skills';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'Full name is required.'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['Active', 'On Leave']),
  designTools: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  palette: z.string().optional(),
});

type EditDesignerProfileFormProps = {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const DESIGN_TOOLS = [
    "Figma", "Adobe XD", "Sketch", "Adobe Illustrator", "Adobe Photoshop", 
    "Canva", "InVision", "Zeplin", "Framer", "Principle"
];
const SPECIALIZATIONS = [
    "UI Design", "UX Design", "Branding", "Illustration", "Motion Graphics", 
    "Web Design", "Mobile App Design", "Design Systems", "Prototyping", "User Research"
];


export function EditDesignerProfileForm({ user, isOpen, onOpenChange }: EditDesignerProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [toolInput, setToolInput] = useState('');
  const [specInput, setSpecInput] = useState('');
  
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || '',
      bio: user.bio || '',
      status: user.status || 'Active',
      designTools: user.designTools || [],
      specializations: user.specializations || [],
      palette: user.palette || '',
    },
  });

  const { fields: toolFields, append: appendTool, remove: removeTool } = useFieldArray({
    control: form.control as any, name: "designTools" as any
  });
  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control: form.control as any, name: "specializations" as any
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: user.name,
        phone: user.phone || '',
        bio: user.bio || '',
        status: user.status || 'Active',
        designTools: user.designTools || [],
        specializations: user.specializations || [],
        palette: user.palette || '',
      });
    }
  }, [isOpen, user, form]);

  const handleAddTag = (
    value: string,
    currentTags: string[],
    appendFn: (v: any) => void,
    setInputFn: (v: string) => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !currentTags.includes(trimmed)) {
      appendFn(trimmed);
    }
    setInputFn('');
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      
      const updateData: Partial<UserProfile> = {
        name: values.name,
        phone: values.phone,
        bio: values.bio,
        status: values.status,
        designTools: values.designTools,
        specializations: values.specializations,
        palette: values.palette,
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
          <DialogDescription>Update your designer profile information below.</DialogDescription>
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
                <FormItem><FormLabel>Bio / About</FormLabel><FormControl><Textarea placeholder="Tell us a little about your design philosophy" rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Current Status</FormLabel><Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Set your status" /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="On Leave">On Leave</SelectItem></SelectContent>
                </Select><FormMessage /></FormItem>
              )}/>
              
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Brush className="h-4 w-4" /> Preferred Design Tools</FormLabel>
                <FormControl>
                    <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-12 items-center">
                        {toolFields.map((field, index) => (
                            <Badge key={field.id} variant="secondary">
                                {form.getValues("designTools")?.[index]}
                                <button type="button" onClick={() => removeTool(index)} className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                         <Input
                            value={toolInput}
                            onChange={(e) => setToolInput(e.target.value)}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(toolInput, form.getValues('designTools') || [], appendTool, setToolInput))}
                            placeholder="Add tool..."
                            className="flex-1 h-auto p-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] bg-transparent"
                          />
                    </div>
                </FormControl>
                <div className="flex flex-wrap gap-1 pt-1">
                    {DESIGN_TOOLS.filter(t => !form.getValues('designTools')?.includes(t)).map(tool => (
                        <Button key={tool} type="button" size="sm" variant="outline" onClick={() => handleAddTag(tool, form.getValues('designTools') || [], appendTool, setToolInput)}>{tool}</Button>
                    ))}
                </div>
              </FormItem>

              <FormItem>
                <FormLabel className="flex items-center gap-2"><Tag className="h-4 w-4" /> Specializations</FormLabel>
                <FormControl>
                    <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-12 items-center">
                        {specFields.map((field, index) => (
                            <Badge key={field.id} variant="outline">
                                {form.getValues("specializations")?.[index]}
                                <button type="button" onClick={() => removeSpec(index)} className="ml-1.5 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                         <Input
                            value={specInput}
                            onChange={(e) => setSpecInput(e.target.value)}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(specInput, form.getValues('specializations') as any || [], appendSpec, setSpecInput))}
                            placeholder="Add specialization..."
                            className="flex-1 h-auto p-1 border-none shadow-none focus-visible:ring-0 min-w-[140px] bg-transparent"
                          />
                    </div>
                </FormControl>
                 <div className="flex flex-wrap gap-1 pt-1">
                    {SPECIALIZATIONS.filter(s => !form.getValues('specializations')?.includes(s as any)).map(spec => (
                        <Button key={spec} type="button" size="sm" variant="outline" onClick={() => handleAddTag(spec, form.getValues('specializations') as any || [], appendSpec, setSpecInput)}>{spec}</Button>
                    ))}
                </div>
              </FormItem>
              
               <FormField control={form.control} name="palette" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2"><Palette className="h-4 w-4" /> Preferred Color Palette (Hex)</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-2">
                            <Input placeholder="#FFFFFF" className="w-32" {...field} />
                            <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: field.value }}></div>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
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
