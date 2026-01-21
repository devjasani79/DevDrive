'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Upload, Folder, FileText, ImageIcon, Video } from 'lucide-react';
import { useRecentFiles, useStorageStats } from '@/hooks/useFiles';
import { formatFileSize, formatDate, getFileIcon } from '@/utils/fileUtils';
import FileUpload from './FileUpload';
import FileMenu from './FileMenu';

interface MainContentProps {
  user: {
    $id: string;
    name?: string;
    email: string;
  };
}

const MainContent: React.FC<MainContentProps> = ({ user }) => {
  const { recentFiles, loading: filesLoading, error: filesError, refetch } = useRecentFiles(user.$id);
  const { stats, loading: statsLoading, error: statsError } = useStorageStats(user.$id);

  const handleFileDeleted = () => {
    // Refresh the files list when a file is deleted
    refetch();
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {user.name || user.email.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your files and folders in your personal cloud storage
        </p>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>
                Your recently accessed files and folders
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <a href="/files">View All Files</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted animate-pulse">
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filesError ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading files: {filesError}</p>
            </div>
          ) : recentFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No files yet. Start by uploading your first file!</p>
              <FileUpload onUploadComplete={refetch}>
                <Button className="mt-4">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </FileUpload>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => {
                const IconComponent = getFileIcon(file.mimeType, file.type === 'folder');
                return (
                  <div key={file.$id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
                    <div className="flex items-center space-x-3 flex-1 cursor-pointer">
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
                    <FileMenu file={file} onDelete={handleFileDeleted} onMove={handleFileDeleted} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>
            See how your storage space is being used
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-8 w-8 mx-auto mb-2 bg-muted-foreground/20 rounded"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded mb-1"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-16 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : statsError ? (
            <div className="text-center py-4 text-destructive">
              <p>Error loading storage stats: {statsError}</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-file-documents" />
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(stats.documents.size)}</p>
              </div>
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-file-images" />
                <p className="text-sm font-medium">Images</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(stats.images.size)}</p>
              </div>
              <div className="text-center">
                <Video className="h-8 w-8 mx-auto mb-2 text-file-videos" />
                <p className="text-sm font-medium">Videos</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(stats.videos.size)}</p>
              </div>
              <div className="text-center">
                <Folder className="h-8 w-8 mx-auto mb-2 text-file-folders" />
                <p className="text-sm font-medium">Other</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(stats.others.size)}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No storage data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainContent;
