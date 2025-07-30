'use server';
/**
 * @fileOverview A flow to delete a user from Firebase Authentication.
 *
 * - deleteUser - A function that handles deleting a user from Auth.
 * - DeleteUserInput - The input type for the deleteUser function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// This is a placeholder for your service account key.
// In a real environment, this should be stored securely (e.g., as a secret).
let adminApp: App | undefined;
try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

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
  async ({ uid }) => {
    if (!adminApp) {
        return {
            success: true, // Allow Firestore deletion to proceed
            message: 'Firebase Admin SDK not configured. Skipping deletion from Authentication, but proceeding with database deletion.'
        }
    }
    try {
      await getAuth(adminApp).deleteUser(uid);
      return {
        success: true,
        message: `Successfully deleted user ${uid} from Firebase Authentication.`,
      };
    } catch (error: any) {
      console.error('Error deleting user from Firebase Auth:', error);
      // It's possible the user is already deleted or doesn't exist in Auth.
      // We can consider some errors as "successful" from the client's perspective.
      if (error.code === 'auth/user-not-found') {
        return {
          success: true,
          message: `User ${uid} was not found in Firebase Authentication, but proceeding with database deletion.`,
        };
      }
      throw new Error(`Failed to delete user from Authentication: ${error.message}`);
    }
  }
);
