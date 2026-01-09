import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PassportData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
}

interface DataPreviewProps {
  data: PassportData;
  imageBase64?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export default function DataPreview({
  data: initialData,
  imageBase64,
  onSuccess,
  onBack,
}: DataPreviewProps) {
  const [data, setData] = useState<PassportData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMutation = trpc.invitations.generateLetter.useMutation();

  const handleChange = (field: keyof PassportData, value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        placeOfBirth: data.placeOfBirth,
        passportNumber: data.passportNumber,
        imageBase64,
      });

      if (result.success) {
        toast.success(`Invitation letter generated: ${result.filename}`);
        
        // Trigger download
        const link = document.createElement('a');
        link.href = result.pdfUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate letter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Review & Edit Data</CardTitle>
        <CardDescription>
          Review the extracted data and make corrections if needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY)</Label>
            <Input
              id="dateOfBirth"
              value={data.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              placeholder="DD/MM/YYYY"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeOfBirth">Place of Birth</Label>
            <Input
              id="placeOfBirth"
              value={data.placeOfBirth}
              onChange={(e) => handleChange('placeOfBirth', e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="passportNumber">Passport Number</Label>
            <Input
              id="passportNumber"
              value={data.passportNumber}
              onChange={(e) => handleChange('passportNumber', e.target.value)}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isGenerating}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
