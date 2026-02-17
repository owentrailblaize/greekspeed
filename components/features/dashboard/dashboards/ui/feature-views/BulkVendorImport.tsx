'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Download, Loader2, Upload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkVendorImportResult,
  BulkVendorImportRow,
  VENDOR_COLUMN_NAME_MAPPINGS,
  VendorImportColumnMapping,
} from '@/types/vendors';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

interface BulkVendorImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_MAPPING: VendorImportColumnMapping = {
  name: null,
  type: null,
  contact_person: null,
  email: null,
  phone: null,
  notes: null,
  website: null,
  address: null,
};

export function BulkVendorImport({ onClose, onSuccess }: BulkVendorImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<VendorImportColumnMapping>(DEFAULT_MAPPING);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<BulkVendorImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        const nextChar = line[i + 1];
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  };

  const normalizeHeader = (header: string) =>
    header.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_').trim();

  const parseCSV = (importFile: File): Promise<ParsedData> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = String(event.target?.result || '');
          const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

          if (lines.length < 2) {
            reject(new Error('File must include one header row and at least one data row.'));
            return;
          }

          const headers = parseCSVLine(lines[0]).map(normalizeHeader);
          const rows: Record<string, string>[] = [];

          for (let i = 1; i < lines.length && i <= 1001; i++) {
            const values = parseCSVLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = (values[index] || '').replace(/^["']|["']$/g, '');
            });

            if (Object.values(row).some((value) => value.trim().length > 0)) {
              rows.push(row);
            }
          }

          if (rows.length === 0) {
            reject(new Error('No valid data rows were found in the file.'));
            return;
          }

          resolve({ headers, rows });
        } catch {
          reject(new Error('Unable to parse CSV file.'));
        }
      };
      reader.onerror = () => reject(new Error('Unable to read file.'));
      reader.readAsText(importFile);
    });

  const parseExcel = async (importFile: File): Promise<ParsedData> => {
    const ExcelJS = (await import('exceljs')).default;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            reject(new Error('No worksheet found in Excel file.'));
            return;
          }

          const headers: string[] = [];
          const rows: Record<string, string>[] = [];

          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              row.eachCell({ includeEmpty: false }, (cell) => {
                headers.push(normalizeHeader(String(cell.value || '')));
              });
            } else if (rowNumber <= 1001) {
              const rowData: Record<string, string> = {};
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (headers[colNumber - 1]) {
                  rowData[headers[colNumber - 1]] = String(cell.value || '');
                }
              });

              if (Object.values(rowData).some((value) => value.trim().length > 0)) {
                rows.push(rowData);
              }
            }
          });

          if (headers.length === 0 || rows.length === 0) {
            reject(new Error('Could not find usable data in the file.'));
            return;
          }

          resolve({ headers, rows });
        } catch {
          reject(new Error('Unable to parse Excel file.'));
        }
      };
      reader.onerror = () => reject(new Error('Unable to read file.'));
      reader.readAsArrayBuffer(importFile);
    });
  };

  const parseFile = async (importFile: File): Promise<ParsedData> => {
    if (importFile.name.endsWith('.csv') || importFile.type === 'text/csv') {
      return parseCSV(importFile);
    }
    return parseExcel(importFile);
  };

  const autoDetectColumns = (headers: string[]): VendorImportColumnMapping => {
    const mapping: VendorImportColumnMapping = { ...DEFAULT_MAPPING };

    (Object.keys(VENDOR_COLUMN_NAME_MAPPINGS) as Array<keyof VendorImportColumnMapping>).forEach((field) => {
      const aliases = VENDOR_COLUMN_NAME_MAPPINGS[field];
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        const match = aliases.some((alias) => {
          const normalizedAlias = alias.toLowerCase().replace(/[_\s-]/g, '');
          return normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias);
        });
        if (match) {
          mapping[field] = header;
          break;
        }
      }
    });

    return mapping;
  };

  const handleIncomingFile = async (incomingFile: File) => {
    setError(null);

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    const isValidType =
      validTypes.includes(incomingFile.type) ||
      incomingFile.name.endsWith('.csv') ||
      incomingFile.name.endsWith('.xlsx') ||
      incomingFile.name.endsWith('.xls');

    if (!isValidType) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls).');
      return;
    }

    if (incomingFile.size > 5 * 1024 * 1024) {
      setError('File size must be 5MB or less.');
      return;
    }

    setFile(incomingFile);
    try {
      const data = await parseFile(incomingFile);
      setParsedData(data);
      setColumnMapping(autoDetectColumns(data.headers));
      setStep('mapping');
    } catch (parseError) {
      setFile(null);
      setParsedData(null);
      setError(parseError instanceof Error ? parseError.message : 'Unable to parse file.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      await handleIncomingFile(selected);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      await handleIncomingFile(dropped);
    }
  };

  const mappedRows = useMemo<BulkVendorImportRow[]>(() => {
    if (!parsedData) {
      return [];
    }

    return parsedData.rows.map((row) => ({
      name: columnMapping.name ? row[columnMapping.name] || '' : '',
      type: columnMapping.type ? row[columnMapping.type] || '' : 'Other',
      contact_person: columnMapping.contact_person ? row[columnMapping.contact_person] || '' : '',
      email: columnMapping.email ? row[columnMapping.email] || '' : '',
      phone: columnMapping.phone ? row[columnMapping.phone] || '' : '',
      notes: columnMapping.notes ? row[columnMapping.notes] || '' : '',
      website: columnMapping.website ? row[columnMapping.website] || '' : '',
      address: columnMapping.address ? row[columnMapping.address] || '' : '',
    }));
  }, [columnMapping, parsedData]);

  const validationPreview = useMemo(() => {
    const invalid: Array<{ row: number; reason: string }> = [];
    mappedRows.forEach((row, index) => {
      const rowNumber = index + 2;
      if (!row.name?.trim()) {
        invalid.push({ row: rowNumber, reason: 'Missing vendor/company name' });
      } else if (row.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
        invalid.push({ row: rowNumber, reason: 'Invalid email format' });
      }
    });

    return {
      total: mappedRows.length,
      valid: mappedRows.length - invalid.length,
      invalid,
    };
  }, [mappedRows]);

  const updateMapping = (field: keyof VendorImportColumnMapping, value: string) => {
    setColumnMapping((current) => ({
      ...current,
      [field]: value === '__none__' ? null : value,
    }));
  };

  const handleImport = useCallback(async () => {
    setError(null);
    setIsUploading(true);
    setStep('importing');

    try {
      const response = await fetch('/api/vendors/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendors: mappedRows.filter((row) =>
            Object.values(row).some((value) => typeof value === 'string' && value.trim().length > 0)
          ),
          options: { skipDuplicates, batchSize: 30 },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bulk import failed.');
      }

      setResults(data.results as BulkVendorImportResult);
      setStep('results');
      onSuccess();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Bulk import failed.');
      setStep('preview');
    } finally {
      setIsUploading(false);
    }
  }, [mappedRows, onSuccess, skipDuplicates]);

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <Upload className="mx-auto h-10 w-10 text-gray-500 mb-3" />
        <p className="text-sm font-medium text-gray-800">Drag and drop your CSV or Excel file here</p>
        <p className="text-xs text-gray-500 mt-1">Supports CSV, XLSX, XLS up to 5MB</p>
        <Button className="mt-4" type="button" onClick={() => fileInputRef.current?.click()}>
          Choose File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Alert>
        <Download className="h-4 w-4" />
        <AlertDescription>
          Recommended columns: Vendor/Company Name, Type, Contact Person, Email, Phone, Notes.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderMappingStep = () => {
    if (!parsedData) return null;

    const mappingRows: Array<{ key: keyof VendorImportColumnMapping; label: string; required?: boolean }> = [
      { key: 'name', label: 'Vendor/Company Name', required: true },
      { key: 'type', label: 'Type' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'notes', label: 'Notes' },
      { key: 'website', label: 'Website' },
      { key: 'address', label: 'Address' },
    ];

    return (
      <div className="space-y-4">
        {mappingRows.map((field) => (
          <div key={field.key} className="grid gap-2 sm:grid-cols-2 sm:items-center">
            <label className="text-sm font-medium text-gray-700">
              {field.label} {field.required ? '*' : ''}
            </label>
            <select
              className="h-10 rounded-md border border-gray-300 px-3 text-sm"
              value={columnMapping[field.key] || '__none__'}
              onChange={(event) => updateMapping(field.key, event.target.value)}
            >
              <option value="__none__">Not mapped</option>
              {parsedData.headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="text-xs text-gray-500">
          Rows detected: <span className="font-semibold">{parsedData.rows.length}</span>
        </div>
      </div>
    );
  };

  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Total Rows</p>
            <p className="text-xl font-semibold">{validationPreview.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Valid Rows</p>
            <p className="text-xl font-semibold text-green-600">{validationPreview.valid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Invalid Rows</p>
            <p className="text-xl font-semibold text-red-600">{validationPreview.invalid.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-md border p-3">
        <Checkbox checked={skipDuplicates} onCheckedChange={(value) => setSkipDuplicates(Boolean(value))} />
        <label className="text-sm text-gray-700">Skip duplicate vendors instead of failing those rows</label>
      </div>

      {validationPreview.invalid.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationPreview.invalid.slice(0, 5).map((entry) => (
              <div key={`${entry.row}-${entry.reason}`}>Row {entry.row}: {entry.reason}</div>
            ))}
            {validationPreview.invalid.length > 5 && (
              <div>+ {validationPreview.invalid.length - 5} more invalid rows</div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderResultsStep = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            Import finished: {results.successful} created, {results.failed} failed, {results.duplicates} duplicates.
          </AlertDescription>
        </Alert>

        {results.errors.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Failed Rows</CardTitle>
            </CardHeader>
            <CardContent className="max-h-56 overflow-y-auto space-y-1 text-xs">
              {results.errors.map((entry) => (
                <div key={`${entry.row}-${entry.error}`}>
                  Row {entry.row} ({entry.name}): {entry.error}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const disableNext =
    (step === 'upload' && !parsedData) ||
    (step === 'mapping' && !columnMapping.name) ||
    (step === 'preview' && validationPreview.valid === 0) ||
    step === 'importing';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold">Bulk Import Vendor Contacts</h2>
            <p className="text-xs text-gray-500">Step: {step}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && (
            <div className="py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-primary" />
              <p className="mt-3 text-sm text-gray-600">Importing vendor contacts...</p>
            </div>
          )}
          {step === 'results' && renderResultsStep()}
        </div>

        <div className="border-t px-4 py-3 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'mapping') setStep('upload');
              else if (step === 'preview') setStep('mapping');
              else if (step === 'results') onClose();
            }}
            disabled={step === 'upload' || step === 'importing'}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step === 'results' ? (
            <Button onClick={onClose}>Done</Button>
          ) : (
            <Button
              onClick={() => {
                if (step === 'upload' && parsedData) setStep('mapping');
                else if (step === 'mapping') setStep('preview');
                else if (step === 'preview') void handleImport();
              }}
              disabled={disableNext}
            >
              {step === 'preview' ? 'Import' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
