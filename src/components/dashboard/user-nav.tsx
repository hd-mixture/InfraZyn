

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

export function UserNav() {
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('admin@devtexhhub.com');
  const [userRole, setUserRole] = useState('admin');
  const [profileLink, setProfileLink] = useState('/?view=profile');
  const [settingsLink, setSettingsLink] = useState('/?view=settings');
  const [avatar, setAvatar] = useState<string | null>(null);

  const updateUserData = useCallback(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    let userAvatar = localStorage.getItem('userAvatar');

    if (role === 'admin') {
        const adminName = localStorage.getItem('adminName');
        const adminAvatar = localStorage.getItem('adminAvatar');
        setUserName(adminName || 'Admin');
        setUserEmail('admin@devtexhhub.com');
        setUserRole('admin');
        setProfileLink('/?view=profile');
        setSettingsLink('/?view=settings');
        setAvatar(adminAvatar);
    } else if (role === 'manager' && name) {
        setUserName(name);
        setUserEmail(email || `${name.toLowerCase().replace(' ', '.')}@devtexhhub.com`);
        setUserRole('manager');
        setProfileLink('/manager-dashboard?view=profile');
        setSettingsLink('/manager-dashboard?view=settings');
        setAvatar(userAvatar);
    } else if (role === 'qa' && name) {
        setUserName(name);
        setUserEmail(email || `${name.toLowerCase().replace(' ', '.')}@example.com`);
        setUserRole('qa');
        setProfileLink('/qa-dashboard?view=profile');
        setSettingsLink('/qa-dashboard?view=settings');
        setAvatar(userAvatar);
    } else {
        // Default to admin if no role is set (e.g., initial state)
        setUserName('Admin');
        setUserEmail('admin@devtexhhub.com');
        setUserRole('admin');
        setProfileLink('/?view=profile');
        setSettingsLink('/?view=settings');
        setAvatar(localStorage.getItem('adminAvatar'));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        updateUserData();

        window.addEventListener('storage', updateUserData);

        return () => {
            window.removeEventListener('storage', updateUserData);
        }
    }
  }, [updateUserData]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        const theme = localStorage.getItem('theme');
        const adminName = localStorage.getItem('adminName');
        const adminPhone = localStorage.getItem('adminPhone');
        const adminAvatar = localStorage.getItem('adminAvatar');

        localStorage.clear();

        if (theme) localStorage.setItem('theme', theme);
        if (adminName) localStorage.setItem('adminName', adminName);
        if (adminPhone) localStorage.setItem('adminPhone', adminPhone);
        if (adminAvatar) localStorage.setItem('adminAvatar', adminAvatar);

        updateUserData();
    }
  }
  
  const AdminAvatar = () => (
      <div className="orbit-container">
          <div className="orbit-glow"></div>
          <div className="orbit"></div>
          <div className="avatar-container">
            <Avatar className="h-9 w-9">
                <AvatarImage src={avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`} data-ai-hint="person face" alt="User avatar" />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
      </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
         {userRole === 'admin' ? <AdminAvatar /> : (
            <Avatar className="h-9 w-9">
                <AvatarImage src={avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`} data-ai-hint="person face" alt="User avatar" />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
         )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profileLink}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={settingsLink}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild onClick={handleLogout}>
          <Link href="/login">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
