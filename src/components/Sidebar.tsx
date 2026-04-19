'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Progress } from './ui/progress';
import { LayoutDashboard, FolderOpen, HardDrive, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorageStats } from '@/hooks/useFiles';
import { formatFileSize } from '@/utils/fileUtils';
import { APPWRITE_CONFIG } from '@/config/appwrite';
import FileUpload from './FileUpload';

interface SidebarProps {
  className?: string;
  userId?: string;
}

const nav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FolderOpen,      label: 'My Files',  href: '/files'     },
];

export default function Sidebar({ className, userId }: SidebarProps) {
  const { stats }  = useStorageStats(userId || '');
  const pathname   = usePathname();
  const used       = stats?.totalSize ?? 0;
  const total      = APPWRITE_CONFIG.MAX_TOTAL_STORAGE;
  const pct        = total > 0 ? (used / total) * 100 : 0;

  return (
    <aside className={cn(
      'w-64 h-full flex flex-col gap-2 py-4 px-3',
      className
    )}>

      {/* Upload button */}
      <FileUpload>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all glow-primary">
          <Plus className="h-4 w-4" />
          Upload File
        </button>
      </FileUpload>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 mt-2">
        {nav.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground glass-hover'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Storage */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <HardDrive className="h-4 w-4 text-primary" />
          Storage
        </div>
        <Progress value={pct} className="h-1.5 bg-white/10" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(used)} used</span>
          <span>{formatFileSize(total)}</span>
        </div>
        {pct > 80 && (
          <p className="text-xs text-destructive font-medium">
            Storage almost full
          </p>
        )}
      </div>

    </aside>
  );
}