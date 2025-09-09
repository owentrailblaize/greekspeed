'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Lock,
  X
} from 'lucide-react';

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
  createdUsers: Array<any>;
  skipped: Array<any>;
}

interface BulkAlumniUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkAlumniUpload({ onClose, onSuccess }: BulkAlumniUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [options, setOptions] = useState({
    generatePasswords: true,
    defaultPassword: 'Welcome2024!',
    sendWelcomeEmails: false,
    batchSize: 100
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    console.log('📄 Selected file:', selectedFile);
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(selectedFile);
      setResults(null);
    } else {
      alert('Please select a valid Excel file (.xlsx)');
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    // You'll need to install a library like 'xlsx' for Excel parsing
    // npm install xlsx
    const XLSX = await import('xlsx');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform the data to match your expected format
          const transformedData = jsonData.map((row: any, index: number) => {
            const transformed = {
              email: row.email || row.Email || row.EMAIL,
              first_name: row.first_name || row.firstName || row['First Name'],
              last_name: row.last_name || row.lastName || row['Last Name'],
              chapter: row.chapter || row.Chapter || row.CHAPTER,
              industry: row.industry || row.Industry || row.INDUSTRY,
              graduation_year: row.graduation_year || row.graduationYear || row['Graduation Year'],
              company: row.company || row.Company || row.COMPANY,
              job_title: row.job_title || row.jobTitle || row['Job Title'],
              phone: row.phone || row.Phone || row.PHONE,
              location: row.location || row.Location || row.LOCATION,
              description: row.description || row.Description || row.DESCRIPTION,
              pledge_class: row.pledge_class || row.pledgeClass || row['Pledge Class'],
              major: row.major || row.Major || row.MAJOR,
              hometown: row.hometown || row.Hometown || row.HOMETOWN
            };
            
            // Debug logging for first few rows
            if (index < 3) {
              console.log(`📊 Row ${index} original:`, row);
              console.log(`📊 Row ${index} transformed:`, transformed);
            }
            
            return transformed;
          }).filter(row => row.email && row.first_name && row.last_name);

          resolve(transformedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadTemplate = () => {
    const template = [
      ['email', 'first_name', 'last_name', 'chapter', 'industry', 'graduation_year', 'company', 'job_title', 'phone', 'location', 'description', 'pledge_class', 'major', 'hometown'],
      ['john.doe@example.com', 'John', 'Doe', 'Sigma Chi', 'Technology', '2020', 'Microsoft', 'Software Engineer', '(555) 123-4567', 'Seattle, WA', 'Passionate about technology', 'Fall 2016', 'Computer Science', 'Seattle, WA']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    console.log('🚀 Starting upload process...');
    setIsUploading(true);
    setProgress(0);
    setResults(null);

    try {
      console.log('📄 Parsing Excel file...');
      const alumniData = await parseExcelFile(file);
      
      if (alumniData.length === 0) {
        alert('No valid data found in the Excel file');
        setIsUploading(false);
        return;
      }

      console.log(`📊 Parsed ${alumniData.length} alumni records`);
      console.log('📄 Sending request to API...');

      const response = await fetch('/api/alumni/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumniData,
          options
        }),
      });

      console.log('📥 Received response:', response.status);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📋 API result:', result);
      setResults(result.results);
      setProgress(100);

      // Auto-download Excel file with email/password pairs if passwords were generated OR default password used
      if (result.results.createdUsers.length > 0) {
        console.log('📥 Auto-downloading Excel file with credentials...');
        downloadCredentialsExcel(result.results.createdUsers);
      }

    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // New function to download Excel file with credentials
  const downloadCredentialsExcel = (createdUsers: any[]) => {
    // Filter users that have passwords (newly created users)
    const usersWithPasswords = createdUsers.filter(user => user.password);
    
    if (usersWithPasswords.length === 0) {
      console.log('No users with passwords to download');
      return;
    }

    // Create Excel data
    const excelData = [
      ['Email', 'Password'], // Header row
      ...usersWithPasswords.map(user => [user.email, user.password])
    ];

    // Convert to CSV format (Excel can open CSV files)
    const csvContent = excelData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded credentials for ${usersWithPasswords.length} users`);
  };

  const downloadResults = () => {
    if (!results) return;

    const csvContent = [
      ['email', 'status', 'error', 'password'],
      ...results.createdUsers.map((user: any) => [
        user.email,
        'success',
        '',
        user.password || 'N/A' // Always show actual passwords, not 'Hidden'
      ]),
      ...results.errors.map((error: any) => [
        error.email,
        'failed',
        error.error,
        ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alumni_upload_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Bulk Alumni Upload</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="file-upload">Select Excel File</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button
                variant="outline"
                onClick={downloadTemplate}
                disabled={isUploading}
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {file.name} selected ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          {/* Upload Options */}
          <div className="space-y-4">
            <Label>Upload Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generate-passwords"
                checked={options.generatePasswords}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, generatePasswords: !!checked }))
                }
              />
              <Label htmlFor="generate-passwords">Generate secure passwords</Label>
            </div>
            {!options.generatePasswords && (
              <div className="space-y-2">
                <Label htmlFor="default-password">Default Password</Label>
                <Input
                  id="default-password"
                  type="text"
                  value={options.defaultPassword}
                  onChange={(e) => setOptions(prev => ({ ...prev, defaultPassword: e.target.value }))}
                  placeholder="Enter default password for all users"
                />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={() => {
              console.log('🚀 Button clicked!');
              handleUpload();
            }}
            disabled={!file || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Bulk Upload
              </>
            )}
          </Button>

          {/* Loading Spinner */}
          {isUploading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Processing alumni upload...</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upload Results</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <Lock className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showPasswords ? 'Hide' : 'Show'} Passwords
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Results
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.successful}</strong> successful
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.failed}</strong> failed
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{results.skipped?.length || 0}</strong> skipped
                  </AlertDescription>
                </Alert>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Errors ({results.errors.length})</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        <strong>{error.email}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.createdUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Created Users ({results.createdUsers.length})</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.createdUsers.map((user, index) => (
                      <div key={index} className="text-sm text-green-600 p-2 bg-green-50 rounded">
                        <strong>{user.email}</strong>
                        {showPasswords && user.password && ` - Password: ${user.password}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}