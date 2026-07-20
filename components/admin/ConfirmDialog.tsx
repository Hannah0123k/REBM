"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Accessible confirmation modal for destructive actions. Optionally requires the
 * user to type a confirmation word (e.g. DELETE) before the confirm button
 * enables. Escape cancels. Focus moves into the dialog on open, is trapped
 * within it (Tab/Shift+Tab cycle), and returns to the trigger on close.
 */
export function ConfirmDialog({
  title,
  body,
  confirmWord,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmWord?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ready = !confirmWord || typed.trim().toUpperCase() === confirmWord.toUpperCase();

  const panelRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLElement>(null);

  // Move focus in on open; restore it to the trigger on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    initialFocusRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  // Escape to cancel; Tab trapped within the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-[24px]"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="w-full max-w-[440px] rounded-[16px] bg-white p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-[20px] font-bold text-rebm-navy">
          {title}
        </h2>
        <p id="confirm-body" className="mt-[10px] text-[14px] leading-[21px] text-[rgb(60,70,80)]">
          {body}
        </p>

        {confirmWord && (
          <input
            ref={initialFocusRef as React.RefObject<HTMLInputElement>}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type ${confirmWord}`}
            className="mt-[16px] w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[10px] text-[15px] outline-none focus:border-rebm-blue"
          />
        )}

        <div className="mt-[20px] flex justify-end gap-[10px]">
          <button
            type="button"
            ref={confirmWord ? undefined : (initialFocusRef as React.RefObject<HTMLButtonElement>)}
            onClick={onCancel}
            className="rounded-full border border-rebm-card-border px-[18px] py-[9px] text-[14px] font-medium text-rebm-navy hover:bg-[#F0F2F4]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={onConfirm}
            className={`rounded-full px-[18px] py-[9px] text-[14px] font-medium text-white disabled:opacity-40 ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-rebm-navy hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
