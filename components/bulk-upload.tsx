'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X } from 'lucide-react';

interface BulkUploadResult {
  success: boolean;
  results: Array<{
    name: string;
    email: string;
    status: 'success' | 'error';
    error?: string;
    assigned_tier?: string;
  }>;
  processed_count: number;
  success_count: number;
  error_count: number;
}

export default function BulkUploadComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const fileName = selectedFile.name.toLowerCase();
      const fileType = selectedFile.type;
      
      if (
        fileType.includes('csv') || 
        fileName.endsWith('.csv') || 
        fileType.includes('excel') || 
        fileName.endsWith('.xlsx') || 
        fileName.endsWith('.xls')
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Invalid file type. Please upload a CSV or Excel file.');
        setFile(null);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/customers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Customer Upload
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file containing customer data (name, email, phone, total spending)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
              id="bulk-upload-file"
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => document.getElementById('bulk-upload-file')?.click()}
              disabled={uploading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            {file && (
              <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md flex-1">
                <span className="truncate text-sm">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading and processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-2xl font-bold text-green-700">{result.success_count}</div>
                  <div className="text-sm text-green-600">Added</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-2xl font-bold text-blue-700">{result.processed_count}</div>
                  <div className="text-sm text-blue-600">Processed</div>
                </div>
                <div className="bg-destructive/10 p-3 rounded-md">
                  <div className="text-2xl font-bold text-destructive">{result.error_count}</div>
                  <div className="text-sm text-destructive">Errors</div>
                </div>
              </div>

              {result.results.some(r => r.status === 'error') && (
                <div className="border rounded-md">
                  <div className="bg-destructive/10 p-3 font-medium border-b">
                    Failed to Add ({result.error_count})
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {result.results
                      .filter(r => r.status === 'error')
                      .map((item, index) => (
                        <div key={index} className="p-3 text-sm">
                          <div className="font-medium">{item.name || item.email}</div>
                          <div className="text-destructive text-xs">{item.error}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Processing...' : 'Upload Customers'}
        </Button>
      </CardFooter>
    </Card>
  );
}