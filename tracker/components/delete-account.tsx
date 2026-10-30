"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { deleteAccount } from "@/lib/actions";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState(deleteAccount, null);
  const ready = confirm === "DELETE";
  return (
    <>
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      {open ? (
        <Sheet
          open
          onOpenChange={setOpen}
          title="Delete account"
          description="This deletes your training log and signs you out. It can't be undone."
        >
          <form className="stack" action={action}>
            <label htmlFor="confirm">
              Type DELETE to confirm
              <input
                id="confirm"
                name="confirm"
                autoComplete="off"
                value={confirm}
                aria-describedby={state?.error ? "delete-error" : undefined}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            {state?.error ? (
              <p id="delete-error" className="alert" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" variant="danger" disabled={!ready || pending} pending={pending} pendingLabel="Deleting…">
              Delete account
            </Button>
          </form>
        </Sheet>
      ) : null}
    </>
  );
}
