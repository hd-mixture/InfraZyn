
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from "@/components/dashboard/tasks-kanban-view";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getOppositeUser(
  task: Task,
  currentUserId: string
): Promise<{id: string, name: string, role: string} | null> {
  const { assignedTo, project, taskRole } = task;

  const projectDoc = await getDoc(doc(db, 'projects', project));
  if (!projectDoc.exists()) {
    console.error("Project not found for the task.");
    return null;
  }
  const projectManagerName = projectDoc.data().projectManager;

  // Determine who the current user is.
  const usersRef = collection(db, "users");
  const currentUserDoc = await getDoc(doc(usersRef, currentUserId));
  
  let isCurrentUserAssignee = false;
  if (currentUserDoc.exists() && currentUserDoc.data().name === assignedTo) {
      isCurrentUserAssignee = true;
  }

  let recipientName: string | null = null;
  let recipientRole: 'manager' | 'developer' | 'qa' | 'admin' | 'designer' | null = null;
  
  if (isCurrentUserAssignee) {
      // If current user is the assignee, the recipient is the project manager (or admin).
      recipientName = projectManagerName;
      recipientRole = 'manager'; // Assume manager, will handle admin case below
  } else {
      // If current user is not the assignee (i.e., they are the manager/admin), the recipient is the assignee.
      recipientName = assignedTo;
      recipientRole = taskRole;
  }

  if (!recipientName) {
      console.error("Could not determine recipient's name.");
      return null;
  }

  // Handle the special case where the manager is the Admin
  if (recipientName === 'Admin') {
      return { id: 'admin_user_placeholder', name: 'Admin', role: 'admin' };
  }

  // Find the recipient's user document in Firestore to get their UID.
  const recipientQuery = query(
      usersRef, 
      where('name', '==', recipientName), 
      where('role', '==', recipientRole)
  );

  const recipientSnapshot = await getDocs(recipientQuery);

  if (!recipientSnapshot.empty) {
      const userDoc = recipientSnapshot.docs[0];
      return { id: userDoc.id, name: userDoc.data().name, role: userDoc.data().role };
  }
  
  console.error(`Could not find user document for: ${recipientName} with role: ${recipientRole}`);
  return null;
}

export function mapToInfraRole(role: string | null): string {
  switch (role) {
    case 'admin':
      return 'Director / Administrator (IPMD)';
    case 'manager':
      return 'Monitoring Officer';
    case 'qa':
      return 'Infrastructure Analyst';
    case 'developer':
      return 'Executive / Policymaker';
    case 'designer':
      return 'Technical Spatial Architect';
    default:
      return 'Project Officer';
  }
}
