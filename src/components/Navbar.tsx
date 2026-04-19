'use client'

import React from 'react';
import { Avatar, AvatarFallback } from './ui/avatar';
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
import { LogOut, User, Menu, Cloud } from 'lucide-react';
import Sidebar from './Sidebar';

interface NavbarProps {
  user: { $id: string; name?: string; email: string };
}

function getInitials(name?: string, email?: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email ? email[0].toUpperCase() : 'U';
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const { refetchUser } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
    await refetchUser();
    router.push('/signin');
  };

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/8 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* Left — mobile menu + logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-xl glass-hover text-muted-foreground hover:text-foreground transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-background border-white/8">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <Sidebar userId={user.$id} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground hidden sm:block tracking-tight">
              GoogleDevDrive
            </span>
            <span className="font-semibold text-foreground sm:hidden tracking-tight">
              GDDrive
            </span>
          </div>
        </div>

        {/* Right — user menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl glass-hover transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium leading-none text-foreground">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-35 truncate">
                  {user.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 glass border-white/10 shadow-xl"
            align="end"
          >
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/8" />
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="cursor-pointer glass-hover rounded-lg"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/8" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive glass-hover rounded-lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </nav>
  );
}