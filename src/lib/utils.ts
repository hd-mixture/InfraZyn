import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from "@/components/dashboard/tasks-kanban-view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getOppositeUser(task: Task, currentUserId: string, currentUserName: string): Promise<{id: string, name: string, role: string} | null> {
    const { assignedTo, project, taskRole } = task;

    let recipientName: string | null = null;
    let recipientRole: string | null = null;
    
    // Determine the recipient's name and role
    if (currentUserName === assignedTo) {
        // Current user is the assignee (dev/qa), so notify the manager or admin.
        const projectDoc = await getDoc(doc(db, 'projects', project));
        if (projectDoc.exists() && projectDoc.data().projectManager) {
            recipientName = projectDoc.data().projectManager;
            recipientRole = 'manager';
        } else {
            // Fallback to notify admin if no manager is assigned
            recipientName = 'Admin';
            recipientRole = 'admin';
        }
    } else {
        // Current user is the assigner (manager/admin), so notify the assignee.
        recipientName = assignedTo;
        recipientRole = taskRole;
    }

    if (!recipientName || !recipientRole) {
        console.error("Could not determine recipient.");
        return null;
    }

    if (recipientRole === 'admin') {
         // The admin user is not in the 'users' collection, so we return a hardcoded object.
         // This assumes the admin's notifications are handled differently or not needed for this flow.
        return { id: 'admin_user', name: 'Admin', role: 'admin' };
    }

    // Find the user document in Firestore to get their UID.
    const userQuery = query(
        collection(db, 'users'), 
        where('name', '==', recipientName), 
        where('role', '==', recipientRole)
    );
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        return { id: userDoc.id, name: userDoc.data().name, role: userDoc.data().role };
    }
    
    console.error(`Could not find user document for: ${recipientName} with role: ${recipientRole}`);
    return null;
}
