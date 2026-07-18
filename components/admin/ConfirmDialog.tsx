"use client";

import { useEffect, useState } from "react";

/**
 * Accessible confirmation modal for destructive actions. Optionally requires the
 * user to type a confirmation word (e.g. DELETE) before the confirm button
 * enables. Escape cancels; focus starts on the dialog.
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-[24px]"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[440px] rounded-[16px] bg-white p-[28px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-[20px] font-bold text-rebm-navy">
          {title}
        </h2>
        <p className="mt-[10px] text-[14px] leading-[21px] text-[rgb(60,70,80)]">{body}</p>

        {confirmWord && (
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type ${confirmWord}`}
            className="mt-[16px] w-full rounded-[10px] border border-rebm-card-border px-[14px] py-[10px] text-[15px] outline-none focus:border-rebm-blue"
          />
        )}

        <div className="mt-[20px] flex justify-end gap-[10px]">
          <button
            type="button"
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
