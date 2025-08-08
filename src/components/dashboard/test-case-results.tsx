
'use client'
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

type TestCaseResultsProps = {
    qaName: string | null;
};

export function TestCaseResults({ qaName }: TestCaseResultsProps) {
  const [tasks, setTasks] = useState<{ status: 'To Do' | 'In Progress' | 'Done', testType: string }[]>([]);

  useEffect(() => {
    if (!qaName) return;
    
    const tasksQuery = query(
        collection(db, "tasks"),
        where("assignedTo", "==", qaName),
        where("taskRole", "==", "qa"),
        where("testType", "in", ["Manual Testing", "Regression Testing", "Automation Testing", "UAT (User Acceptance Testing)"])
    );
    
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({ status: doc.data().status, testType: doc.data().testType }));
        setTasks(fetchedTasks as any);
    });

    return () => unsubscribe();
  }, [qaName]);

  const stats = useMemo(() => {
    const passed = tasks.filter(task => task.status === 'Done').length;
    // For simplicity, we'll consider 'To Do' and 'In Progress' as not failed yet.
    // A more complex system might have a 'Failed' status.
    const failed = 0; 
    return { passed, failed };
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Case Results</CardTitle>
        <CardDescription>Outcome of your testing tasks.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-around items-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.passed}</p>
          <p className="text-sm text-muted-foreground">Passed</p>
        </div>
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.failed}</p>
          <p className="text-sm text-muted-foreground">Failed</p>
        </div>
      </CardContent>
    </Card>
  )
}
