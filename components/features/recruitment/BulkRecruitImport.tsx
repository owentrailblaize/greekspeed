'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Download,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Table
} from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { 
  BulkRecruitImportResult, 
  ColumnMapping,
  CreateRecruitRequest 
} from '@/types/recruitment';
import { COLUMN_NAME_MAPPINGS } from '@/types/recruitment';
import { Select, SelectItem } from '@/components/ui/select';

interface BulkRecruitImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export function BulkRecruitImport({ onClose, onSuccess }: BulkRecruitImportProps) {
  const { getAuthHeaders } = useAuth();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    hometown: null,
    phone_number: null,
    instagram_handle: null,
    notes: null,
  });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<BulkRecruitImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    
    const isValidType = validTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls');

    if (!isValidType) {
      setError('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    
    // Parse the file
    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);
      
      // Auto-detect column mappings
      const autoMapping = autoDetectColumns(data.headers);
      setColumnMapping(autoMapping);
      
      // Move to mapping step
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setFile(null);
    }
  };

  // Parse Excel or CSV file
  const parseFile = async (file: File): Promise<ParsedData> => {
    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      return parseCSV(file);
    } else {
      return parseExcel(file);
    }
  };

  // Parse CSV file
  const parseCSV = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('File must have at least a header row and one data row'));
            return;
          }

          // Parse CSV properly (handle quoted values)
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const headers = parseCSVLine(lines[0]).map(h => 
            h.toLowerCase().replace(/\s+/g, '_').replace(/['"]/g, '')
          );
          
          const rows: Record<string, string>[] = [];
          for (let i = 1; i < lines.length && i <= 1001; i++) { // Limit to 1000 rows
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.replace(/^["']|["']$/g, '') || '';
            });
            if (Object.values(row).some(v => v.trim())) { // Skip empty rows
              rows.push(row);
            }
          }

          if (rows.length === 0) {
            reject(new Error('No valid data rows found in file'));
            return;
          }

          resolve({ headers, rows });
        } catch (err) {
          reject(new Error('Failed to parse CSV file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Parse Excel file
  const parseExcel = async (file: File): Promise<ParsedData> => {
    const ExcelJS = (await import('exceljs')).default;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            reject(new Error('No worksheet found in Excel file'));
            return;
          }

          const headers: string[] = [];
          const rows: Record<string, string>[] = [];
          
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              // Header row
              row.eachCell({ includeEmpty: false }, (cell) => {
                const header = cell.value?.toString().toLowerCase().replace(/\s+/g, '_') || '';
                headers.push(header);
              });
            } else if (rowNumber <= 1001) { // Limit to 1000 data rows
              const rowData: Record<string, string> = {};
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (colNumber <= headers.length) {
                  const header = headers[colNumber - 1];
                  rowData[header] = cell.value?.toString() || '';
                }
              });
              if (Object.values(rowData).some(v => v.trim())) {
                rows.push(rowData);
              }
            }
          });

          if (headers.length === 0) {
            reject(new Error('No headers found in Excel file'));
            return;
          }

          if (rows.length === 0) {
            reject(new Error('No valid data rows found in file'));
            return;
          }

          resolve({ headers, rows });
        } catch (err) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Auto-detect column mappings based on header names
  const autoDetectColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      name: null,
      hometown: null,
      phone_number: null,
      instagram_handle: null,
      notes: null,
    };

    for (const [field, possibleNames] of Object.entries(COLUMN_NAME_MAPPINGS)) {
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        for (const possibleName of possibleNames) {
          const normalizedPossible = possibleName.toLowerCase().replace(/[_\s-]/g, '');
          if (normalizedHeader === normalizedPossible || normalizedHeader.includes(normalizedPossible)) {
            mapping[field as keyof ColumnMapping] = header;
            break;
          }
        }
        if (mapping[field as keyof ColumnMapping]) break;
      }
    }

    return mapping;
  };

  // Get mapped recruits from parsed data
  const getMappedRecruits = useCallback((): CreateRecruitRequest[] => {
    if (!parsedData) return [];
    
    return parsedData.rows.map(row => ({
      name: columnMapping.name ? row[columnMapping.name] || '' : '',
      hometown: columnMapping.hometown ? row[columnMapping.hometown] || '' : '',
      phone_number: columnMapping.phone_number ? row[columnMapping.phone_number] || '' : undefined,
      instagram_handle: columnMapping.instagram_handle ? row[columnMapping.instagram_handle] || '' : undefined,
    }));
  }, [parsedData, columnMapping]);

  // Get validation preview
  const getValidationPreview = useCallback(() => {
    const recruits = getMappedRecruits();
    const valid: number[] = [];
    const invalid: Array<{ row: number; reason: string }> = [];

    recruits.forEach((recruit, index) => {
      const rowNum = index + 2; // +2 for 1-indexed + header
      if (!recruit.name?.trim()) {
        invalid.push({ row: rowNum, reason: 'Missing name' });
      } else if (!recruit.hometown?.trim()) {
        invalid.push({ row: rowNum, reason: 'Missing hometown' });
      } else {
        valid.push(rowNum);
      }
    });

    return { valid, invalid, total: recruits.length };
  }, [getMappedRecruits]);

  // Handle import
  const handleImport = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const recruits = getMappedRecruits();
      
      // Filter out completely empty rows
      const validRecruits = recruits.filter(r => r.name?.trim() || r.hometown?.trim());

      const headers = getAuthHeaders();
      const response = await fetch('/api/recruitment/recruits/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          recruits: validRecruits,
          options: {
            skipDuplicates,
            batchSize: 50,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(errorData.error || 'Import failed');
      }

      const data = await response.json();
      setResults(data.results);
      setStep('results');

      // Trigger refresh if any were successful
      if (data.results.successful > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      ['name', 'hometown', 'phone_number', 'instagram_handle', 'notes'],
      ['John Smith', 'Dallas, TX', '(555) 123-4567', 'johnsmith', 'Great candidate from rush event'],
      ['Jane Doe', 'Austin, TX', '555-987-6543', '@janedoe', 'Met at philanthropy'],
    ];

    const csvContent = template.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recruit_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download results
  const downloadResults = () => {
    if (!results) return;

    const csvContent = [
      ['Row', 'Name', 'Status', 'Details'],
      ...results.createdRecruits.map(r => ['', r.name, 'Created', '']),
      ...results.skippedDuplicates.map(d => [d.row.toString(), d.name, 'Skipped (Duplicate)', d.reason]),
      ...results.errors.map(e => [e.row.toString(), e.name, 'Failed', e.error]),
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruit_import_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-brand-primary transition-colors">
        <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supports .xlsx, .xls, and .csv files (max 5MB, 1000 rows)
        </p>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Select File
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={downloadTemplate} className="rounded-full">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
    </div>
  );

  // Render mapping step
  const renderMappingStep = () => {
    if (!parsedData) return null;

    const mappingFields: Array<{ key: keyof ColumnMapping; label: string; required: boolean }> = [
      { key: 'name', label: 'Name', required: true },
      { key: 'hometown', label: 'Hometown', required: true },
      { key: 'phone_number', label: 'Phone Number', required: false },
      { key: 'instagram_handle', label: 'Instagram Handle', required: false },
      { key: 'notes', label: 'Notes', required: false },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-800">
            <Table className="h-5 w-5" />
            <span className="font-medium">
              Found {parsedData.rows.length} rows with {parsedData.headers.length} columns
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">Map Your Columns</Label>
          <p className="text-sm text-gray-600">
            Match the columns from your file to the recruit fields. Required fields are marked with *
          </p>

          <div className="grid gap-4">
            {mappingFields.map(({ key, label, required }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-40">
                  <Label className="text-sm">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                </div>
                <div className="flex-1">
                  <Select
                    value={columnMapping[key] || ''}
                    onValueChange={(value) => {
                      setColumnMapping(prev => ({
                        ...prev,
                        [key]: value === '__none__' ? null : value,
                      }));
                    }}
                    placeholder="Select column..."
                  >
                    <SelectItem value="__none__">-- Not mapped --</SelectItem>
                    {parsedData.headers.map(header => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                {columnMapping[key] && (
                  <div className="w-8">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview first few rows */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview (first 3 rows)</Label>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Hometown</th>
                  <th className="px-3 py-2 text-left font-medium">Phone</th>
                  <th className="px-3 py-2 text-left font-medium">Instagram</th>
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      {columnMapping.name ? row[columnMapping.name] || '-' : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {columnMapping.hometown ? row[columnMapping.hometown] || '-' : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {columnMapping.phone_number ? row[columnMapping.phone_number] || '-' : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {columnMapping.instagram_handle ? row[columnMapping.instagram_handle] || '-' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => {
            setStep('upload');
            setFile(null);
            setParsedData(null);
          }} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => setStep('preview')}
            disabled={!columnMapping.name || !columnMapping.hometown}
            className="rounded-full"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Render preview step
  const renderPreviewStep = () => {
    const preview = getValidationPreview();

    return (
      <div className="space-y-6">
        {/* Validation Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{preview.total}</div>
            <div className="text-sm text-gray-600">Total Rows</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{preview.valid.length}</div>
            <div className="text-sm text-green-600">Valid</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{preview.invalid.length}</div>
            <div className="text-sm text-red-600">Invalid</div>
          </div>
        </div>

        {/* Invalid rows warning */}
        {preview.invalid.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{preview.invalid.length} rows</strong> will be skipped due to missing required fields:
              <ul className="mt-2 list-disc list-inside text-sm">
                {preview.invalid.slice(0, 5).map((item, i) => (
                  <li key={i}>Row {item.row}: {item.reason}</li>
                ))}
                {preview.invalid.length > 5 && (
                  <li>... and {preview.invalid.length - 5} more</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Import options */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Import Options</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-duplicates"
              checked={skipDuplicates}
              onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
            />
            <Label htmlFor="skip-duplicates" className="text-sm">
              Skip duplicate recruits (recommended)
            </Label>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Duplicates are detected by matching name with phone number or Instagram handle
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setStep('mapping')} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleImport}
            disabled={preview.valid.length === 0 || isUploading}
            className="rounded-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import {preview.valid.length} Recruits
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render results step
  const renderResultsStep = () => {
    if (!results) return null;

    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          {results.successful > 0 ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <h3 className="text-xl font-semibold text-gray-900">
            Import {results.successful > 0 ? 'Complete' : 'Failed'}
          </h3>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{results.successful}</strong> created
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{results.failed}</strong> failed
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{results.duplicates}</strong> duplicates
            </AlertDescription>
          </Alert>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>{results.total}</strong> total
            </AlertDescription>
          </Alert>
        </div>

        {/* Error details */}
        {results.errors.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Errors ({results.errors.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                  <strong>Row {error.row} ({error.name}):</strong> {error.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplicates skipped */}
        {results.skippedDuplicates.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Skipped Duplicates ({results.skippedDuplicates.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.skippedDuplicates.map((dup, index) => (
                <div key={index} className="text-sm text-amber-600 p-2 bg-amber-50 rounded">
                  <strong>Row {dup.row} ({dup.name}):</strong> {dup.reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Created recruits */}
        {results.createdRecruits.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Created Recruits ({results.createdRecruits.length})</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {results.createdRecruits.slice(0, 10).map((recruit, index) => (
                <div key={index} className="text-sm text-green-600 p-2 bg-green-50 rounded">
                  {recruit.name}
                </div>
              ))}
              {results.createdRecruits.length > 10 && (
                <div className="text-sm text-gray-500 p-2">
                  ... and {results.createdRecruits.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={downloadResults} className="rounded-full">
            <Download className="h-4 w-4 mr-2" />
            Download Results
          </Button>
          <Button onClick={onClose} className="rounded-full">
            Done
          </Button>
        </div>
      </div>
    );
  };

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Upload File';
      case 'mapping': return 'Map Columns';
      case 'preview': return 'Review & Import';
      case 'importing': return 'Importing...';
      case 'results': return 'Import Results';
      default: return 'Import Recruits';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-brand-primary" />
              <span>{getStepTitle()}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress indicator */}
          {step !== 'results' && (
            <div className="flex items-center space-x-2 mt-4">
              {['upload', 'mapping', 'preview'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s ? 'bg-brand-primary text-white' :
                    ['upload', 'mapping', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {['upload', 'mapping', 'preview'].indexOf(step) > i ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 2 && (
                    <div className={`w-12 h-1 mx-2 ${
                      ['upload', 'mapping', 'preview'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'results' && renderResultsStep()}
        </CardContent>
      </Card>
    </div>
  );
}

