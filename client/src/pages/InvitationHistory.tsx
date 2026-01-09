import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Download, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function InvitationHistory() {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: historyData, isLoading, error } = trpc.invitations.getHistory.useQuery();
  const deleteMutation = trpc.invitations.deleteLetter.useMutation();

  const letters = historyData?.letters || [];

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.invitations.getHistory.invalidate();
      toast.success('Invitation letter deleted');
      setDeletingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete letter');
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Invitation History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Invitation History</CardTitle>
        <CardDescription>
          View and manage all generated invitation letters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load history</AlertDescription>
          </Alert>
        )}

        {letters.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No invitation letters generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Passport Number</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {letters.map((letter) => (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">
                      {letter.firstName} {letter.lastName}
                    </TableCell>
                    <TableCell>{letter.passportNumber}</TableCell>
                    <TableCell>{letter.dateOfBirth}</TableCell>
                    <TableCell>
                      {new Date(letter.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDownload(letter.pdfUrl, `invitation-${letter.lastName}-${letter.firstName}.pdf`)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletingId(letter.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogTitle>Delete Invitation Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation letter? This action cannot be undone.
            </AlertDialogDescription>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingId && handleDelete(deletingId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
