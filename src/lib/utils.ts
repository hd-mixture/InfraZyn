import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from "@/components/dashboard/tasks-kanban-view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getOppositeUser(task: Task, currentUserId: string): Promise<{id: string, name: string, role: string} | null> {
    const { assignedTo, project, taskRole } = task;

    let recipientName: string | null = null;
    let recipientRole: string | null = null;
    
    // If the current user is the person the task is assigned to (e.g., a developer or QA)
    if (localStorage.getItem('userName') === assignedTo) {
        // The recipient should be the project manager
        const projectDoc = await getDoc(doc(db, 'projects', project));
        if (projectDoc.exists()) {
            recipientName = projectDoc.data().projectManager;
            // The role of a project manager is 'manager'
            recipientRole = 'manager';
        }
    } else { 
        // If the current user is the one who assigned the task (manager/admin), notify the assignee
        recipientName = assignedTo;
        recipientRole = taskRole; // 'developer' or 'qa'
    }

    if (!recipientName || !recipientRole) return null;

    // Find the user document for the recipient to get their ID
    const usersQuery = query(collection(db, 'users'), where('name', '==', recipientName), where('role', '==', recipientRole));
    const usersSnap = await getDocs(usersQuery);

    if (!usersSnap.empty) {
        const recipientDoc = usersSnap.docs[0];
        return { 
            id: recipientDoc.id, 
            name: recipientDoc.data().name, 
            role: recipientDoc.data().role 
        };
    }

    return null;
}
