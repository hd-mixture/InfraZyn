

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
import { LogOut, Settings, User, Code, ShieldCheck, Palette } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { mapToInfraRole } from "@/lib/utils";

const roleIcons: { [key: string]: React.ReactNode } = {
    developer: <Code className="h-3 w-3 text-blue-500" />,
    qa: <ShieldCheck className="h-3 w-3 text-green-500" />,
    designer: <Palette className="h-3 w-3 text-orange-500" />,
};

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
    } else if (role === 'developer' && name) {
        setUserName(name);
        setUserEmail(email || `${name.toLowerCase().replace(' ', '.')}@example.com`);
        setUserRole('developer');
        setProfileLink('/developer-dashboard?view=profile');
        setSettingsLink('/developer-dashboard?view=settings');
        setAvatar(userAvatar);
    } else if (role === 'designer' && name) {
        setUserName(name);
        setUserEmail(email || `${name.toLowerCase().replace(' ', '.')}@example.com`);
        setUserRole('designer');
        setProfileLink('/designer-dashboard?view=profile');
        setSettingsLink('/designer-dashboard?view=settings');
        setAvatar(userAvatar);
    } else {
        setUserName('Director (IPMD)');
        setUserEmail('director.ipmd@devtexhhub.com');
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
            <div className="relative">
              <Avatar className="h-9 w-9">
                  <AvatarImage src={avatar || `https://placehold.co/40x40.png?text=${userName.charAt(0)}`} data-ai-hint="person face" alt="User avatar" />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              {roleIcons[userRole] && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background p-0.5">
                      {roleIcons[userRole]}
                  </div>
              )}
            </div>
         )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{userName}</p>
            <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {mapToInfraRole(userRole)}
            </p>
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
