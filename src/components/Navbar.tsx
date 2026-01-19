'use client'

import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { logoutUser } from '@/client/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface NavbarProps {
  user: {
    $id: string;
    name?: string;
    email: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const { refetchUser } = useAuth();

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      await refetchUser();
      router.push('/signin');
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button and Logo */}
        <div className="flex items-center space-x-4">
          {/* Mobile Sidebar Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <Sidebar className="border-r-0" userId={user.$id} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-brand rounded flex items-center justify-center">
              <span className="text-brand-foreground font-bold text-sm">GD</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">
              Google Drive Clone
            </h1>
            <h1 className="text-xl font-semibold text-foreground sm:hidden">
              Drive
            </h1>
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2 md:space-x-4">          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name || user.email} />
                  <AvatarFallback className="bg-brand text-brand-foreground">
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
