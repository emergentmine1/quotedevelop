import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

// Confirmation popup for deactivating / deleting a rate profile. `action` is 'deactivate' | 'delete'.
const COPY = {
  deactivate: {
    title: 'Deactivate rate profile?',
    body: (code) => `${code} will be set to Inactive and stop being used for quotes. You can activate it again later.`,
    confirm: 'Deactivate',
    tone: 'bg-amber-600 hover:bg-amber-700',
  },
  delete: {
    title: 'Delete rate profile?',
    body: (code) => `${code} and its whole Rate Matrix will be permanently deleted. This cannot be undone.`,
    confirm: 'Delete',
    tone: 'bg-red-600 hover:bg-red-700',
  },
};

export function ConfirmProfileAction({ pending, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const copy = pending ? COPY[pending.action] : null;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(pending);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={!!pending} onOpenChange={(open) => !open && !busy && onCancel()}>
      <AlertDialogContent data-testid="confirm-profile-dialog">
        {copy && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="confirm-profile-title">{copy.title}</AlertDialogTitle>
              <AlertDialogDescription>{copy.body(pending.profile.profileCode)}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="confirm-profile-cancel" disabled={busy}>Cancel</AlertDialogCancel>
              <Button data-testid="confirm-profile-confirm" disabled={busy} onClick={confirm} className={`text-white gap-1.5 ${copy.tone}`}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {copy.confirm}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
