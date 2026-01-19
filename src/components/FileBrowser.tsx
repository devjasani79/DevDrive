'use client'

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Folder, 
  ArrowLeft, 
  Search, 
  Grid, 
  List,
  Plus,
  Upload
} from 'lucide-react';
import { useUserFiles, useCreateFolder, useFileOperations } from '@/hooks/useFiles';
import { formatFileSize, formatDate, getFileIcon } from '@/utils/fileUtils';
import { FileItem } from '@/types/files';
import FileMenu from './FileMenu';
import FileUpload from './FileUpload';
import { toast } from 'sonner';

interface FileBrowserProps {
  userId: string;
}

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ userId }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Drive' }
  ]);

  const { files, loading, error, refetch } = useUserFiles(userId, currentFolderId);
  const { createFolder, loading: creatingFolder } = useCreateFolder();
  const { openFile } = useFileOperations();

  // Filter files based on search query
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFolderOpen = useCallback((folder: FileItem) => {
    setCurrentFolderId(folder.$id);
    setBreadcrumbs(prev => [...prev, { id: folder.$id, name: folder.name }]);
  }, []);

  const handleBreadcrumbClick = useCallback((breadcrumb: BreadcrumbItem, index: number) => {
    setCurrentFolderId(breadcrumb.id || undefined);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  }, []);

  const handleGoBack = useCallback(() => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const parentBreadcrumb = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(parentBreadcrumb.id || undefined);
      setBreadcrumbs(newBreadcrumbs);
    }
  }, [breadcrumbs]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    const folderName = newFolderName.trim();

    // Validate folder name length
    if (folderName.length > 255) {
      toast.error('Folder name is too long (maximum 255 characters)');
      return;
    }

    // Check for invalid characters in folder name
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(folderName)) {
      toast.error('Folder name contains invalid characters (< > : " / \\ | ? *)');
      return;
    }

    // Check if folder name already exists in current directory
    const existingFolder = files.find(file => 
      file.type === 'folder' && 
      file.name.toLowerCase() === folderName.toLowerCase()
    );
    if (existingFolder) {
      toast.error('A folder with this name already exists');
      return;
    }

    try {
      await createFolder(folderName, userId, currentFolderId);
      toast.success('Folder created successfully');
      setNewFolderName('');
      setIsCreatingFolder(false);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      toast.error(errorMessage);
    }
  };

  const handleFileDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFileClick = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      handleFolderOpen(file);
    } else {
      openFile(file);
    }
  }, [handleFolderOpen, openFile]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted animate-pulse">
                <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>Error loading files: {error}</p>
            <Button onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Files</CardTitle>
            <CardDescription>Browse and manage your files and folders</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.id || 'root'}>
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(breadcrumb, index)}
                className="text-foreground hover:text-primary transition-colors"
                disabled={index === breadcrumbs.length - 1}
              >
                {breadcrumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <FileUpload onUploadComplete={refetch} parentId={currentFolderId} existingFiles={files}>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </FileUpload>
          </div>
        </div>

        {/* New Folder Input */}
        {isCreatingFolder && (
          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolderName.trim()}
            >
              Create
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* File List */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? (
              <p>No files found matching &ldquo;{searchQuery}&rdquo;</p>
            ) : (
              <div>
                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>This folder is empty</p>
                <p className="text-sm">Upload files or create folders to get started</p>
              </div>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
          }>
            {filteredFiles.map((file) => {
              const IconComponent = getFileIcon(file.mimeType, file.type === 'folder');
              
              if (viewMode === 'grid') {
                return (
                  <div key={file.$id} className="group relative p-4 border rounded-lg hover:bg-muted transition-colors">
                    <div 
                      className="text-center cursor-pointer"
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="mx-auto mb-2 p-3 bg-muted rounded-lg w-fit">
                        <IconComponent className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      {file.type !== 'folder' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <FileMenu 
                        file={file} 
                        onDelete={handleFileDeleted}
                        onMove={handleFileDeleted}
                        onOpen={() => handleFileClick(file)}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={file.$id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                  <div 
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="p-2 bg-muted rounded">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">{file.name}</p>
                        {file.type !== 'folder' && file.mimeType && (
                          <Badge variant="secondary" className="text-xs">
                            {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {file.type === 'folder' ? '—' : formatFileSize(file.size)} • Modified {formatDate(file.$updatedAt)}
                      </p>
                    </div>
                  </div>
                  <FileMenu 
                    file={file} 
                    onDelete={handleFileDeleted}
                    onMove={handleFileDeleted}
                    onOpen={() => handleFileClick(file)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileBrowser;
