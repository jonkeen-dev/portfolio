"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content className="sheet" onCloseAutoFocus={onCloseAutoFocus}>
          <div className="sheet-handle" aria-hidden="true" />
          <div className="sheet-head">
            <Dialog.Title className="sheet-title">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" className="sheet-close" aria-label="Close">
                <span aria-hidden="true">✕</span>
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
