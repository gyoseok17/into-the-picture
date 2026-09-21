import { useEffect } from "react";

type EscapeDismissOptions = {
  enabled?: boolean;
  capture?: boolean;
  preventDefault?: boolean;
  stopImmediatePropagation?: boolean;
};

/** Adds one consistent Escape-to-dismiss listener without prescribing dialog UI. */
export function useEscapeDismiss(
  onDismiss: () => void,
  {
    enabled = true,
    capture = false,
    preventDefault = false,
    stopImmediatePropagation = false,
  }: EscapeDismissOptions = {},
): void {
  useEffect(() => {
    if (!enabled) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (preventDefault) event.preventDefault();
      if (stopImmediatePropagation) event.stopImmediatePropagation();
      onDismiss();
    };

    window.addEventListener("keydown", handleKeyDown, capture);
    return () => window.removeEventListener("keydown", handleKeyDown, capture);
  }, [capture, enabled, onDismiss, preventDefault, stopImmediatePropagation]);
}
