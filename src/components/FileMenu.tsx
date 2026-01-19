'use client'

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  MoreVertical, 
  Download, 
  Trash2, 
  Share, 
  Info,
  ExternalLink,
  Move,
  Folder,
  FolderOpen,
  Copy
} from 'lucide-react';
import { FileItem } from '@/types/files';
import { useFileOperations, useAllFolders } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { getFileCategory } from '@/config/appwrite';
import { toast } from 'sonner';
import { formatFileSize, formatFullDate, getFileExtension, getFileIcon } from '@/utils/fileUtils';

interface FileMenuProps {
  file: FileItem;
  onDelete?: () => void;
  onOpen?: () => void;
  onMove?: () => void;
}

const FileMenu: React.FC<FileMenuProps> = ({ file, onDelete, onOpen, onMove }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { deleteFile, moveFile, openFile, getFileDownloadUrl, getFileViewUrl, loading } = useFileOperations();
  const { user } = useAuth();
  const { folders, loading: foldersLoading } = useAllFolders(user?.$id || '');

  const handleDelete = async () => {
    try {
      await deleteFile(file.$id);
      toast.success(`${file.type === 'folder' ? 'Folder' : 'File'} deleted successfully`);
      onDelete?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${file.type === 'folder' ? 'folder' : 'file'}`;
      toast.error(errorMessage);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleMove = async () => {
    try {
      await moveFile(file.$id, selectedFolderId || undefined);
      toast.success(`${file.type === 'folder' ? 'Folder' : 'File'} moved successfully`);
      onMove?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to move ${file.type === 'folder' ? 'folder' : 'file'}`;
      toast.error(errorMessage);
    } finally {
      setShowMoveDialog(false);
      setSelectedFolderId(null);
    }
  };

  const handleOpen = () => {
    if (file.type === 'folder') {
      onOpen?.();
    } else {
      openFile(file);
    }
  };

  const handleDownload = () => {
    if (file.bucketFileId) {
      const downloadUrl = getFileDownloadUrl(file.bucketFileId);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    }
  };

  const handleShare = () => {
    // For now, just copy the file ID to clipboard
    // In a real app, you'd implement proper sharing functionality
    navigator.clipboard.writeText(file.$id);
    toast.success('File ID copied to clipboard');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleOpen}>
            {file.type === 'folder' ? (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Folder
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open File
              </>
            )}
          </DropdownMenuItem>
          
          {file.type === 'file' && file.bucketFileId && (
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
            <Move className="mr-2 h-4 w-4" />
            Move
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
            <Info className="mr-2 h-4 w-4" />
            Details
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {file.type === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{file.name}&rdquo;? 
              {file.type === 'folder' 
                ? ' All files and subfolders inside will also be deleted.' 
                : ' This file will be permanently removed from your storage.'
              }
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Move {file.type === 'folder' ? 'Folder' : 'File'}
            </DialogTitle>
            <DialogDescription>
              Choose a destination folder for &ldquo;{file.name}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Root folder option */}
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === null ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedFolderId(null)}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span>My Drive (Root)</span>
            </div>
            
            {foldersLoading ? (
              <div className="p-3 text-muted-foreground">Loading folders...</div>
            ) : (
              folders
                .filter(folder => folder.$id !== file.$id) // Don't show current file/folder
                .map((folder) => (
                  <div
                    key={folder.$id}
                    className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFolderId === folder.$id ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedFolderId(folder.$id)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span>{folder.name}</span>
                  </div>
                ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMoveDialog(false);
                setSelectedFolderId(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={loading}
            >
              {loading ? 'Moving...' : 'Move Here'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {(() => {
                const IconComponent = getFileIcon(file.mimeType, file.type === 'folder');
                return <IconComponent className="h-5 w-5 text-muted-foreground" />;
              })()}
              <span className="truncate">{file.name}</span>
            </DialogTitle>
            <DialogDescription>
              {file.type === 'folder' ? 'Folder Information' : 'File Information'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Preview for image files */}
            {file.type === 'file' && file.bucketFileId && file.mimeType?.startsWith('image/') && (
              <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFileViewUrl(file.bucketFileId)}
                  alt={file.name}
                  className="max-h-48 max-w-full object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* File/Folder Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm break-all">{file.name}</p>
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-sm">
                {file.type === 'folder' 
                  ? 'Folder' 
                  : file.mimeType 
                    ? (() => {
                        const extension = getFileExtension(file.name);
                        return extension 
                          ? `${file.mimeType} (.${extension.toUpperCase()})`
                          : file.mimeType;
                      })()
                    : 'File'
                }
              </p>
            </div>

            {/* Category (for files) */}
            {file.type === 'file' && file.mimeType && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm capitalize">{getFileCategory(file.mimeType)}</p>
              </div>
            )}

            {/* Size */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Size</label>
              <p className="text-sm">
                {file.type === 'folder' ? '—' : formatFileSize(file.size)}
              </p>
            </div>

            {/* Created Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-sm">{formatFullDate(file.$createdAt)}</p>
            </div>

            {/* Modified Date */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
              <p className="text-sm">{formatFullDate(file.$updatedAt)}</p>
            </div>

            <Separator />

            {/* Technical Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Technical Details</h4>

              {/* ID */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(file.$id);
                      toast.success('ID copied to clipboard');
                    }}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs font-mono break-all">{file.$id}</p>
              </div>

              {/* Storage File ID (if file) */}
              {file.type === 'file' && file.bucketFileId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Storage ID</label>
                  <p className="text-xs font-mono break-all">{file.bucketFileId}</p>
                </div>
              )}

              {/* Parent ID */}
              {file.parentId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Parent Folder ID</label>
                  <p className="text-xs font-mono break-all">{file.parentId}</p>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-sm">
                  {file.parentId ? 'Inside a folder' : 'Root folder (My Drive)'}
                </p>
              </div>
            </div>

            {/* Actions Section */}
            {file.type === 'file' && file.bucketFileId && (
              <>
                <div className="border-t pt-4 mt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Quick Actions</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        openFile(file);
                        setShowDetailsDialog(false);
                      }}
                      className="text-xs"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleDownload();
                        setShowDetailsDialog(false);
                      }}
                      className="text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailsDialog(false);
                        setShowMoveDialog(true);
                      }}
                      className="text-xs"
                    >
                      <Move className="mr-1 h-3 w-3" />
                      Move
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(getFileViewUrl(file.bucketFileId!));
                        toast.success('File link copied to clipboard');
                      }}
                      className="text-xs"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileMenu;
