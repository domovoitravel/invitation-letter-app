import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getLoginUrl } from '@/const';
import PassportUpload from './PassportUpload';
import DataPreview from './DataPreview';
import InvitationHistory from './InvitationHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PassportData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'history'>('upload');
  const [extractedData, setExtractedData] = useState<PassportData | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="text-center space-y-6 max-w-md">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Domovoi Travel
            </h1>
            <p className="text-lg text-slate-600">
              Invitation Letter Generator
            </p>
          </div>
          <p className="text-slate-600">
            Automate the generation of Armenian invitation letters from passport scans
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            size="lg"
            className="w-full"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Domovoi Travel
            </h1>
            <p className="text-slate-600">Invitation Letter Generator</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
            <Button variant="outline" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs
          value={currentStep}
          onValueChange={(value) => setCurrentStep(value as 'upload' | 'preview' | 'history')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload">Upload Passport</TabsTrigger>
            <TabsTrigger value="preview" disabled={!extractedData}>
              Review Data
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <PassportUpload
              onDataExtracted={(data) => {
                setExtractedData(data);
                // Store the image for later use
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput?.files?.[0]) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    setUploadedImageBase64(base64);
                  };
                  reader.readAsDataURL(fileInput.files[0]);
                }
                setCurrentStep('preview');
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {extractedData && (
              <DataPreview
                data={extractedData}
                imageBase64={uploadedImageBase64 || undefined}
                onSuccess={() => {
                  setExtractedData(null);
                  setUploadedImageBase64(null);
                  setCurrentStep('history');
                }}
                onBack={() => {
                  setExtractedData(null);
                  setCurrentStep('upload');
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <InvitationHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
