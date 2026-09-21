import { useEffect, type RefObject } from "react";

/** Focuses a dialog on entry and returns focus to its opener on close. */
export function useDialogFocusRestoration(
  dialogRef: RefObject<HTMLElement | null>,
  active = true,
): void {
  useEffect(() => {
    if (!active) return undefined;

    const returnFocusTarget =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    return () => {
      window.requestAnimationFrame(() => returnFocusTarget?.focus());
    };
  }, [active, dialogRef]);
}
