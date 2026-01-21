'use client'

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFiles';
import { useAuth } from '@/contexts/AuthContext';
import { formatFileSize } from '@/utils/fileUtils';
import { toast } from 'sonner';
import { APPWRITE_CONFIG } from '@/config/appwrite';

interface FileUploadProps {
  children: React.ReactNode;
  onUploadComplete?: () => void;
  parentId?: string;
  existingFiles?: { name: string }[];
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ children, onUploadComplete, parentId, existingFiles = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { uploadFiles } = useFileUpload();

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return;

    const fileArray = Array.from(files);
    
    // Validate files before proceeding
    const validFiles: File[] = [];
    const rejectedFiles: { file: File; reason: string }[] = [];

    fileArray.forEach(file => {
      // Check file size
      if (file.size > APPWRITE_CONFIG.MAX_FILE_SIZE) {
        rejectedFiles.push({
          file,
          reason: `File size (${formatFileSize(file.size)}) exceeds maximum limit of ${formatFileSize(APPWRITE_CONFIG.MAX_FILE_SIZE)}`
        });
        return;
      }

      // Check if file is too small (0 bytes)
      if (file.size === 0) {
        rejectedFiles.push({
          file,
          reason: 'File is empty (0 bytes)'
        });
        return;
      }

      // Check file name length
      if (file.name.length > 255) {
        rejectedFiles.push({
          file,
          reason: 'File name is too long (maximum 255 characters)'
        });
        return;
      }

      // Check for invalid characters in filename
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(file.name)) {
        rejectedFiles.push({
          file,
          reason: 'File name contains invalid characters (< > : " / \\ | ? *)'
        });
        return;
      }

      // Check for duplicate file names
      const duplicateFile = existingFiles.find(existingFile => 
        existingFile.name.toLowerCase() === file.name.toLowerCase()
      );
      if (duplicateFile) {
        rejectedFiles.push({
          file,
          reason: 'A file with this name already exists'
        });
        return;
      }

      validFiles.push(file);
    });

    // Show error messages for rejected files
    rejectedFiles.forEach(({ file, reason }) => {
      toast.error(`Cannot upload "${file.name}": ${reason}`);
    });

    // If no valid files, return early
    if (validFiles.length === 0) {
      return;
    }

    // Show warning if some files were rejected
    if (rejectedFiles.length > 0) {
      toast.warning(`${rejectedFiles.length} file${rejectedFiles.length > 1 ? 's' : ''} could not be uploaded due to validation errors.`);
    }

    const newFiles: UploadFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setFileList(prev => [...prev, ...newFiles]);

    // Use the real upload service
    uploadRealFiles(validFiles);
  };

  const uploadRealFiles = async (files: File[]) => {
    if (!user) return;

    try {
      const results = await uploadFiles(files, user.$id, parentId);
      
      // Check results for individual file errors
      let hasErrors = false;
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          hasErrors = true;
          const errorMessage = result.reason instanceof Error ? result.reason.message : 'Upload failed';
          toast.error(`Failed to upload ${files[index].name}: ${errorMessage}`);
          
          // Update file status to error
          setFileList(prev => prev.map(f => 
            f.file.name === files[index].name 
              ? { ...f, status: 'error' as const }
              : f
          ));
        } else {
          // Update file status to completed
          setFileList(prev => prev.map(f => 
            f.file.name === files[index].name 
              ? { ...f, progress: 100, status: 'completed' as const }
              : f
          ));
        }
      });

      if (!hasErrors) {
        toast.success(`Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
      
      setFileList(prev => prev.map(uploadFile => ({
        ...uploadFile,
        status: 'error' as const
      })));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (fileId: string) => {
    setFileList(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Choose files to upload to your drive
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-brand bg-brand-muted' 
                : 'border-border hover:border-muted-foreground'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop files here, or click to select
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="*/*"
            />
          </div>

          {/* Upload Progress */}
          {fileList.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <h4 className="text-sm font-medium">Uploading Files</h4>
              {fileList.map((uploadFile) => (
                <div key={uploadFile.id} className={`flex items-center space-x-3 p-3 rounded-lg ${
                  uploadFile.status === 'error' ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'
                }`}>
                  <File className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-1 h-1" />
                    )}
                    {uploadFile.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">Upload failed</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Files uploaded successfully');
                setIsOpen(false);
                setFileList([]);
              }}
              disabled={fileList.length === 0 || fileList.some(f => f.status === 'uploading')}
            >
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUpload;
