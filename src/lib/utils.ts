import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from "@/components/dashboard/tasks-kanban-view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getOppositeUser(task: Task, currentUserId: string): Promise<{id: string, name: string} | null> {
    const { assignedTo, project } = task;

    let recipientName: string | null = null;
    let recipientRole: string | null = null;
    
    // If current user is the assignee, notify the manager
    if (localStorage.getItem('userName') === assignedTo) {
        const projectDoc = await getDoc(doc(db, 'projects', project));
        if (projectDoc.exists()) {
            recipientName = projectDoc.data().projectManager;
            recipientRole = 'manager';
        }
    } else { // If current user is manager/admin, notify the assignee
        recipientName = assignedTo;
        recipientRole = task.taskRole;
    }

    if (!recipientName || !recipientRole) return null;

    const usersQuery = query(collection(db, 'users'), where('name', '==', recipientName), where('role', '==', recipientRole));
    const usersSnap = await getDocs(usersQuery);

    if (!usersSnap.empty) {
        const recipientDoc = usersSnap.docs[0];
        return { id: recipientDoc.id, name: recipientDoc.data().name };
    }

    return null;
}
