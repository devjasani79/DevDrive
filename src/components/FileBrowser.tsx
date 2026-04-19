'use client'

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Folder, ArrowLeft, Search, Grid, List,
  Plus, Upload, ChevronRight, Home
} from 'lucide-react';
import { useUserFiles, useCreateFolder, useFileOperations } from '@/hooks/useFiles';
import { formatFileSize, formatDate, getFileIcon } from '@/utils/fileUtils';
import { FileItem } from '@/types/files';
import FileMenu from './FileMenu';
import FileUpload from './FileUpload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileBrowserProps { userId: string }
interface Crumb { id: string | null; name: string }

function fileColorClass(mimeType?: string, isFolder?: boolean) {
  if (isFolder) return { bg: 'bg-file-folder', icon: 'file-icon-folder' };
  if (!mimeType) return { bg: 'bg-file-other', icon: 'file-icon-other' };
  if (mimeType.startsWith('image/')) return { bg: 'bg-file-img', icon: 'file-icon-img' };
  if (mimeType.startsWith('video/')) return { bg: 'bg-file-vid', icon: 'file-icon-vid' };
  if (mimeType.includes('pdf') || mimeType.includes('doc') || mimeType.includes('text'))
    return { bg: 'bg-file-doc', icon: 'file-icon-doc' };
  return { bg: 'bg-file-other', icon: 'file-icon-other' };
}

export default function FileBrowser({ userId }: FileBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [viewMode, setViewMode]               = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery]         = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName]     = useState('');
  const [crumbs, setCrumbs]                   = useState<Crumb[]>([{ id: null, name: 'My Drive' }]);

  const { files, loading, error, refetch }    = useUserFiles(userId, currentFolderId);
  const { createFolder, loading: creating }   = useCreateFolder();
  const { openFile }                          = useFileOperations();

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openFolder = useCallback((folder: FileItem) => {
    setCurrentFolderId(folder.$id);
    setCrumbs(p => [...p, { id: folder.$id, name: folder.name }]);
  }, []);

  const goToCrumb = useCallback((crumb: Crumb, idx: number) => {
    setCurrentFolderId(crumb.id || undefined);
    setCrumbs(p => p.slice(0, idx + 1));
  }, []);

  const goBack = useCallback(() => {
    if (crumbs.length > 1) {
      const next = crumbs.slice(0, -1);
      setCurrentFolderId(next[next.length - 1].id || undefined);
      setCrumbs(next);
    }
  }, [crumbs]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) { toast.error('Enter a folder name'); return; }
    if (files.some(f => f.type === 'folder' && f.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Folder already exists'); return;
    }
    try {
      await createFolder(name, userId, currentFolderId);
      toast.success('Folder created');
      setNewFolderName(''); setIsCreatingFolder(false); refetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleClick = useCallback((file: FileItem) => {
    if (file.type === 'folder') openFolder(file);
    else openFile(file);
  }, [openFolder, openFile]);

  if (loading) return (
    <div className="space-y-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass rounded-xl h-14 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="glass rounded-2xl p-8 text-center">
      <p className="text-destructive mb-4">Failed to load files</p>
      <Button onClick={refetch} variant="outline" size="sm">Try again</Button>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm min-w-0">
          {crumbs.length > 1 && (
            <button onClick={goBack} className="p-1.5 rounded-lg glass-hover text-muted-foreground hover:text-foreground transition-colors mr-1">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {crumbs.map((c, i) => (
            <React.Fragment key={c.id ?? 'root'}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <button
                onClick={() => goToCrumb(c, i)}
                disabled={i === crumbs.length - 1}
                className={cn(
                  'px-1.5 py-0.5 rounded-lg transition-colors truncate max-w-30',
                  i === crumbs.length - 1
                    ? 'text-foreground font-medium cursor-default'
                    : 'text-muted-foreground hover:text-foreground glass-hover cursor-pointer'
                )}
              >
                {i === 0 ? <Home className="h-3.5 w-3.5" /> : c.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap">
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-xl glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass glass-hover text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Folder</span>
          </button>
          <FileUpload onUploadComplete={refetch} parentId={currentFolderId} existingFiles={files}>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </FileUpload>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 glass border-white/10 bg-transparent focus:border-primary/50 rounded-xl"
        />
      </div>

      {/* New folder input */}
      {isCreatingFolder && (
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="p-2 bg-file-folder rounded-lg">
            <Folder className="h-4 w-4 file-icon-folder" />
          </div>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
            }}
            autoFocus
            className="flex-1 glass border-white/10 bg-transparent rounded-xl"
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={creating || !newFolderName.trim()}>
            Create
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}>
            Cancel
          </Button>
        </div>
      )}

      {/* File count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="glass rounded-2xl py-16 text-center space-y-3">
          <div className="w-16 h-16 bg-file-folder rounded-2xl flex items-center justify-center mx-auto">
            <Folder className="h-8 w-8 file-icon-folder" />
          </div>
          <p className="font-medium text-foreground">
            {searchQuery ? `No results for "${searchQuery}"` : 'Nothing here yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search' : 'Upload files or create a folder to get started'}
          </p>
        </div>
      )}

      {/* File grid */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(file => {
            const Icon = getFileIcon(file.mimeType, file.type === 'folder');
            const colors = fileColorClass(file.mimeType, file.type === 'folder');
            return (
              <div key={file.$id} className="glass rounded-xl p-3 group relative hover:border-white/20 transition-all">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileMenu file={file} onDelete={refetch} onMove={refetch} onOpen={() => handleClick(file)} />
                </div>
                <div className="cursor-pointer" onClick={() => handleClick(file)}>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', colors.bg)}>
                    <Icon className={cn('h-6 w-6', colors.icon)} />
                  </div>
                  <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File list */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
          {filtered.map((file, idx) => {
            const Icon = getFileIcon(file.mimeType, file.type === 'folder');
            const colors = fileColorClass(file.mimeType, file.type === 'folder');
            return (
              <div
                key={file.$id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 group hover:bg-white/3 transition-colors',
                  idx === 0 && 'rounded-t-2xl',
                  idx === filtered.length - 1 && 'rounded-b-2xl'
                )}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleClick(file)}
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colors.bg)}>
                    <Icon className={cn('h-4 w-4', colors.icon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                      {' · '}
                      {formatDate(file.$updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="">
                  <FileMenu file={file} onDelete={refetch} onMove={refetch} onOpen={() => handleClick(file)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}