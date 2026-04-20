'use client'
import ShareDialog from './Sharedialog';
import React, { useState } from 'react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  MoreVertical, Download, Trash2, Share, Info,
  ExternalLink, Move, Folder, FolderOpen, Copy, Sparkles,
} from 'lucide-react';
import { FileItem } from '@/types/files';
import { useFileOperations, useAllFolders } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { getFileCategory } from '@/config/appwrite';
import { toast } from 'sonner';
import { formatFileSize, formatFullDate, getFileExtension, getFileIcon } from '@/utils/fileUtils';
import AIFileChat from './AIFileChat';

interface FileMenuProps {
  file: FileItem;
  onDelete?: () => void;
  onOpen?: () => void;
  onMove?: () => void;
}

const FileMenu: React.FC<FileMenuProps> = ({ file, onDelete, onOpen, onMove }) => {
  const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
  const [showMoveDialog,    setShowMoveDialog]    = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAIChat,        setShowAIChat]        = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFolderId,  setSelectedFolderId]  = useState<string | null>(null);

  const { deleteFile, moveFile, openFile, getFileDownloadUrl, getFileViewUrl, loading } = useFileOperations();
  const { user }                  = useAuth();
  const { folders, loading: fl }  = useAllFolders(user?.$id || '');

  const handleDelete = async () => {
    try {
      await deleteFile(file.$id);
      toast.success(`${file.type === 'folder' ? 'Folder' : 'File'} deleted`);
      onDelete?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally { setShowDeleteDialog(false); }
  };

  const handleMove = async () => {
    try {
      await moveFile(file.$id, selectedFolderId || undefined);
      toast.success('Moved successfully');
      onMove?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Move failed');
    } finally { setShowMoveDialog(false); setSelectedFolderId(null); }
  };

  const handleDownload = () => {
    if (!file.bucketFileId) return;
    const a = document.createElement('a');
    a.href = getFileDownloadUrl(file.bucketFileId);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 glass-hover rounded-lg">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 glass border-white/10 shadow-xl rounded-xl">

          <DropdownMenuItem onClick={() => file.type === 'folder' ? onOpen?.() : openFile(file)} className="rounded-lg glass-hover cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {file.type === 'folder' ? 'Open folder' : 'Open file'}
          </DropdownMenuItem>

          {file.type === 'file' && file.bucketFileId && (
            <DropdownMenuItem onClick={handleDownload} className="rounded-lg glass-hover cursor-pointer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}

          {/* ── Ask AI (Feature 2) ── */}
          {file.type === 'file' && (
            <DropdownMenuItem onClick={() => setShowAIChat(true)} className="rounded-lg glass-hover cursor-pointer text-primary focus:text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Ask AI
            </DropdownMenuItem>
          )}

          {file.type === 'file' && file.bucketFileId && (
  <DropdownMenuItem onClick={() => setShowShareDialog(true)} className="rounded-lg glass-hover cursor-pointer">
    <Share className="mr-2 h-4 w-4" />
    Share
  </DropdownMenuItem>
)}
          <DropdownMenuItem onClick={() => setShowMoveDialog(true)} className="rounded-lg glass-hover cursor-pointer">
            <Move className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)} className="rounded-lg glass-hover cursor-pointer">
            <Info className="mr-2 h-4 w-4" />
            Details
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-white/8" />

          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive rounded-lg glass-hover cursor-pointer">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── AI File Chat Dialog ── */}
      <AIFileChat
        file={file}
        open={showAIChat}
        onClose={() => setShowAIChat(false)}
        getFileViewUrl={getFileViewUrl}
      />
<ShareDialog
  file={file}
  open={showShareDialog}
  onClose={() => setShowShareDialog(false)}
/>
      {/* ── Delete Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete {file.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &ldquo;{file.name}&rdquo;?
              {file.type === 'folder' && ' All contents will also be deleted.'}
              {' '}This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Move Dialog ── */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="glass border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Move {file.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
            <DialogDescription>Choose a destination for &ldquo;{file.name}&rdquo;</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            <div
              onClick={() => setSelectedFolderId(null)}
              className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-colors ${selectedFolderId === null ? 'bg-primary/15 border border-primary/20' : 'glass-hover'}`}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">My Drive (root)</span>
            </div>
            {fl ? (
              <p className="text-sm text-muted-foreground p-3">Loading folders...</p>
            ) : (
              folders.filter(f => f.$id !== file.$id).map(folder => (
                <div
                  key={folder.$id}
                  onClick={() => setSelectedFolderId(folder.$id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-colors ${selectedFolderId === folder.$id ? 'bg-primary/15 border border-primary/20' : 'glass-hover'}`}
                >
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{folder.name}</span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowMoveDialog(false); setSelectedFolderId(null); }} disabled={loading}>Cancel</Button>
            <Button onClick={handleMove} disabled={loading}>{loading ? 'Moving...' : 'Move here'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Details Dialog ── */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md glass border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 truncate">
              {(() => { const I = getFileIcon(file.mimeType, file.type === 'folder'); return <I className="h-5 w-5 shrink-0 text-muted-foreground" />; })()}
              <span className="truncate">{file.name}</span>
            </DialogTitle>
            <DialogDescription>{file.type === 'folder' ? 'Folder' : 'File'} details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {file.type === 'file' && file.bucketFileId && file.mimeType?.startsWith('image/') && (
              <div className="glass rounded-xl p-3 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFileViewUrl(file.bucketFileId)} alt={file.name} className="max-h-40 max-w-full object-contain rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            {[
              { label: 'Name',      value: file.name },
              { label: 'Type',      value: file.type === 'folder' ? 'Folder' : (file.mimeType || 'File') },
              { label: 'Size',      value: file.type === 'folder' ? '—' : formatFileSize(file.size) },
              { label: 'Created',   value: formatFullDate(file.$createdAt) },
              { label: 'Modified',  value: formatFullDate(file.$updatedAt) },
              { label: 'Location',  value: file.parentId ? 'Inside folder' : 'My Drive (root)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-muted-foregro">{label}</span>
                <span className="text-foreground text-right truncate">{value}</span>
              </div>
            ))}
            <Separator className="bg-white/8" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-mono truncate flex-1">{file.$id}</span>
              <button onClick={() => { navigator.clipboard.writeText(file.$id); toast.success('ID copied'); }} className="ml-2 p-1.5 rounded-lg glass-hover text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileMenu;