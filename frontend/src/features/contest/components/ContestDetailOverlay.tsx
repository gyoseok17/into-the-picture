import { useEffect, useRef, type ReactNode } from "react";

import { useBodyOverflowLock } from "@/hooks/useBodyOverflowLock";
import { useDialogFocusRestoration } from "@/hooks/useDialogFocusRestoration";
import { useEscapeDismiss } from "@/hooks/useEscapeDismiss";

/** Keeps list-originated detail views modal without giving the page focus-trap duties. */
export function ContestDetailOverlay({
  overlay,
  onClose,
  suspendEscape = false,
  children,
}: {
  overlay: boolean;
  onClose: () => void;
  suspendEscape?: boolean;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useBodyOverflowLock(overlay);
  useDialogFocusRestoration(dialogRef, overlay);
  useEscapeDismiss(onClose, {
    enabled: overlay && !suspendEscape,
    preventDefault: true,
  });

  useEffect(() => {
    if (!overlay) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (suspendEscape || event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [overlay, suspendEscape]);

  if (!overlay) return <>{children}</>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="수상작 상세"
      className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-background md:top-[4.25rem]"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-screen-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 outline-none md:px-8 md:pb-14 md:pt-9"
      >
        {children}
      </div>
    </div>
  );
}
