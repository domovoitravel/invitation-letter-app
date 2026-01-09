import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';

interface PassportData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
}

interface UploadPageProps {
  onDataExtracted?: (data: PassportData) => void;
}

export default function PassportUpload({ onDataExtracted }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractMutation = trpc.invitations.extractPassportData.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or PDF.');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Show preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        try {
          const result = await extractMutation.mutateAsync({
            imageBase64: base64,
            fileName: file.name,
          });

          if (result.success) {
            onDataExtracted?.(result.data);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to extract passport data'
          );
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Passport</CardTitle>
        <CardDescription>
          Upload a scan or photo of the passport to extract information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="passport-file">Select File</Label>
          <Input
            id="passport-file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: JPEG, PNG, PDF (Max 10MB)
          </p>
        </div>

        {preview && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <img
              src={preview}
              alt="Passport preview"
              className="max-w-full h-auto border rounded-lg"
            />
          </div>
        )}

        {file && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Selected file: {file.name}</p>
            <p className="text-xs text-muted-foreground">
              Size: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        <Button
          onClick={handleExtract}
          disabled={!file || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Extract Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
