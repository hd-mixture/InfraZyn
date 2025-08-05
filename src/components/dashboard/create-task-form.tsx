
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CodeXml, ShieldCheck, Palette } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { CreateDeveloperTaskForm } from './create-developer-task-form';
import { CreateQATaskForm } from './create-qa-task-form';
import { CreateDesignerTaskForm } from './create-designer-task-form';


type CreateTaskFormProps = {
    children: React.ReactNode;
    userRole: 'admin' | 'manager';
    managerName?: string | null;
}

export function CreateTaskForm({ children, userRole, managerName }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'developer' | 'qa' | 'designer' | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        setSelectedRole(null);
    }
    setOpen(isOpen);
  }

  const handleSuccess = () => {
    setOpen(false);
    setSelectedRole(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            First, select the role for the new task, then fill in the details.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
            <div className="space-y-6 pr-2">
                <RadioGroup
                    value={selectedRole || ''}
                    onValueChange={(value) => setSelectedRole(value as 'developer' | 'qa' | 'designer')}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <Label htmlFor="developer" className="flex items-center p-4 border rounded-md has-[:checked]:border-primary cursor-pointer w-full">
                         <RadioGroupItem value="developer" id="developer" className="mr-3" />
                         <CodeXml className="mr-3 h-6 w-6" />
                         <div className='flex flex-col'>
                            <span className="font-semibold">Developer</span>
                            <span className="text-xs text-muted-foreground">Technical implementation.</span>
                        </div>
                    </Label>

                    <Label htmlFor="qa" className="flex items-center p-4 border rounded-md has-[:checked]:border-primary cursor-pointer w-full">
                        <RadioGroupItem value="qa" id="qa" className="mr-3" />
                        <ShieldCheck className="mr-3 h-6 w-6" />
                        <div className='flex flex-col'>
                            <span className="font-semibold">QA</span>
                            <span className="text-xs text-muted-foreground">Testing and quality.</span>
                        </div>
                    </Label>

                     <Label htmlFor="designer" className="flex items-center p-4 border rounded-md has-[:checked]:border-primary cursor-pointer w-full">
                        <RadioGroupItem value="designer" id="designer" className="mr-3" />
                        <Palette className="mr-3 h-6 w-6" />
                        <div className='flex flex-col'>
                            <span className="font-semibold">Designer</span>
                            <span className="text-xs text-muted-foreground">UI/UX and graphics.</span>
                        </div>
                    </Label>
                </RadioGroup>

                {selectedRole === 'developer' && <CreateDeveloperTaskForm onSuccess={handleSuccess} userRole={userRole} managerName={managerName} />}
                {selectedRole === 'qa' && <CreateQATaskForm onSuccess={handleSuccess} userRole={userRole} managerName={managerName} />}
                {selectedRole === 'designer' && <CreateDesignerTaskForm onSuccess={handleSuccess} userRole={userRole} managerName={managerName} />}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
