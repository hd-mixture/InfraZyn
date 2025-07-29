
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeXml, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (email === 'admin@devtexhhub.com' && password === 'HD@Mixture08') {
            // Special case for admin login
            await signInWithEmailAndPassword(auth, email, password);
            localStorage.setItem('userRole', 'admin');
            
            const adminName = localStorage.getItem('adminName');
            const adminAvatar = localStorage.getItem('adminAvatar');

            if (adminName) localStorage.setItem('userName', adminName);
            if (adminAvatar) localStorage.setItem('userAvatar', adminAvatar);

            router.push('/');
            toast({ title: "Admin login successful!" });

        } else {
            // Logic for other roles (manager)
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email), where("role", "==", "manager"));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const user = querySnapshot.docs[0].data();
                
                await signInWithEmailAndPassword(auth, email, password);

                localStorage.setItem('userRole', 'manager');
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userAvatar', user.avatar || '');
                router.push('/manager-dashboard');
                toast({ title: "Manager login successful!" });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: "No manager account found with this email.",
                });
            }
        }
    } catch (error: any) {
        console.error("Login Error: ", error);
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = "The password you entered is incorrect. Please try again.";
        }
        if (error.code === 'auth/user-not-found') {
            description = "No user found with this email.";
        }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: description,
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
                <CodeXml className="w-10 h-10 text-primary" />
                <CardTitle className="text-3xl font-bold font-headline">DevTeXhHub</CardTitle>
            </div>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
