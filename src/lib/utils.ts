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
    
    // If current user is the assignee, notify the manager.
    if (localStorage.getItem('userName') === assignedTo) {
        const projectDoc = await getDoc(doc(db, 'projects', project));
        if (projectDoc.exists()) {
            recipientName = projectDoc.data().projectManager;
            recipientRole = 'manager';
        }
    } else { // If current user is the assigner (manager/admin), notify the assignee.
        recipientName = assignedTo;
        recipientRole = taskRole;
    }

    if (!recipientName || !recipientRole) return null;

    // The name of the admin user is not consistent, so if the recipient is a manager
    // let's try a few things. First, check local storage for 'adminName'
    if (recipientRole === 'manager') {
        const adminName = localStorage.getItem('adminName');
        if (recipientName === adminName) {
            // This is the admin. We need their user document.
            // Let's assume there's an admin user in 'users' with role 'admin' for notifications
            const q = query(collection(db, 'users'), where('role', '==', 'admin'));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const doc = snap.docs[0];
                return { id: doc.id, name: doc.data().name, role: doc.data().role };
            }
             // Fallback if no admin in users collection
            return { id: 'admin_user', name: adminName, role: 'admin' };
        }
    }

    // For managers, developers, and QAs in the users collection
    const q = query(collection(db, 'users'), where('name', '==', recipientName), where('role', '==', recipientRole));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const doc = snap.docs[0];
        return { id: doc.id, name: doc.data().name, role: doc.data().role };
    }

    return null;
}
