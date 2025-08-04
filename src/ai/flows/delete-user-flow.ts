
'use server';
/**
 * @fileOverview A flow to delete a user from Firebase Authentication and all associated data.
 *
 * - deleteUser - A function that handles deleting a user from Auth and their associated data.
 * - DeleteUserInput - The input type for the deleteUser function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, WriteBatch } from 'firebase-admin/firestore';

// This is a placeholder for your service account key.
// In a real environment, this should be stored securely (e.g., as a secret).
let adminApp: App | undefined;
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    // The private_key in the service account JSON from an environment variable needs its newlines properly escaped.
    // Here we replace the literal '\\n' with actual newline characters '\n'.
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  }

  if (serviceAccount && !getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else if (getApps().length > 0) {
    adminApp = getApps()[0];
  }
} catch (e) {
    console.warn("Firebase Admin SDK initialization failed. User deletion from Auth will be skipped. Error:", e);
}


const DeleteUserInputSchema = z.object({
  uid: z.string().describe('The UID of the user to delete.'),
  userName: z.string().describe('The name of the user to delete.'),
});
export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;

export async function deleteUser(
  input: DeleteUserInput
): Promise<DeleteUserOutput> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ uid, userName }) => {
    if (!adminApp) {
        return {
            success: false,
            message: 'Firebase Admin SDK not configured. Cannot delete user.'
        }
    }
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);
    let batch = db.batch();
    let authError = null;

    // 1. Delete user from Firebase Authentication
    try {
      await auth.deleteUser(uid);
    } catch (error: any) {
      console.error('Error deleting user from Firebase Auth:', error);
       if (error.code !== 'auth/user-not-found') {
        authError = error.message;
       }
    }

    if(authError){
        // If auth deletion fails for a critical reason, stop the process.
        throw new Error(`Failed to delete user from Authentication: ${authError}`);
    }

    // 2. Delete user document from 'users' collection
    const userDocRef = db.collection('users').doc(uid);
    batch.delete(userDocRef);

    // 3. Find and delete all tasks assigned to the user
    const tasksQuery = db.collection('tasks').where('assignedTo', '==', userName);
    const tasksSnapshot = await tasksQuery.get();
    
    tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    const deletedTasksCount = tasksSnapshot.size;

    // 4. Commit all batched writes to Firestore
    try {
        await batch.commit();
        return {
            success: true,
            message: `Successfully deleted user ${userName}, their user document, and ${deletedTasksCount} assigned tasks.`,
        };
    } catch (error: any) {
        console.error('Error committing batch delete in Firestore:', error);
        throw new Error(`Failed to delete user data from Firestore: ${error.message}`);
    }
  }
);
