"use client";

import { ForcePasswordChangeForm } from "@/components/auth/force-password-change-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ForcePasswordChangeDialog() {
  return (
    <Dialog open modal="trap-focus" disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Defina sua nova senha</DialogTitle>
          <DialogDescription>
            Por segurança, substitua a senha temporária antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <ForcePasswordChangeForm />
      </DialogContent>
    </Dialog>
  );
}
