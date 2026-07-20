"use client";

import { useId, useState } from "react";

/**
 * Reusable subscription card shown at the bottom of every article. A clean white
 * card (rounded, soft shadow) consistent with REBM branding.
 *
 * HONEST + future-ready: there is no newsletter backend wired up yet, so a valid
 * submit does NOT fake a signup — it shows a clear "not connected yet" notice.
 * When a Resend (or other) endpoint exists, replace the marked block in
 * `onSubmit` with the POST and switch `notice` to a success state. Nothing else
 * needs to change.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = { kind: "idle" | "error" | "notice"; msg?: string };

export function SubscribeCard({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const id = useId();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setStatus({ kind: "error", msg: "Please enter a valid email address." });
      return;
    }
    // ── Resend integration goes here (POST the email, then set a success state).
    //    Until an endpoint exists we do NOT fake a subscription. ──
    setStatus({
      kind: "notice",
      msg: "Thanks! Email updates aren’t connected yet — we’ll be in touch once they launch.",
    });
  }

  return (
    <div
      className={`rounded-[24px] bg-white p-[32px] shadow-[0_18px_48px_-24px_rgba(3,44,64,0.28)] sm:p-[40px] ${className}`}
    >
      <div className="mx-auto max-w-[560px] text-center">
        <h2
          id={`${id}-title`}
          className="text-[24px] leading-[30px] font-bold text-rebm-navy sm:text-[28px] sm:leading-[34px]"
        >
          Subscribe to Our Email List
        </h2>
        <p className="mt-[12px] text-[16px] leading-[25px] text-[rgb(70,82,94)]">
          Get REBM’s Market Pulse updates and commercial real estate insights delivered straight to your inbox.
        </p>

        <form
          onSubmit={onSubmit}
          noValidate
          aria-labelledby={`${id}-title`}
          className="mx-auto mt-[24px] flex max-w-[480px] flex-col gap-[10px] sm:flex-row"
        >
          <label htmlFor={`${id}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${id}-email`}
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status.kind !== "idle") setStatus({ kind: "idle" });
            }}
            placeholder="you@company.com"
            aria-invalid={status.kind === "error"}
            aria-describedby={status.kind !== "idle" ? `${id}-status` : undefined}
            className="w-full rounded-full border border-rebm-card-border bg-[#F7FAFD] px-[20px] py-[13px] text-[15px] outline-none transition-[background-color,border-color] duration-200 focus:border-rebm-blue focus:bg-white"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-rebm-navy px-[30px] py-[13px] text-[15px] font-semibold text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
          >
            Subscribe
          </button>
        </form>

        <p
          id={`${id}-status`}
          role="status"
          aria-live="polite"
          className={`mt-[12px] min-h-[20px] text-[14px] ${status.kind === "error" ? "text-red-600" : "text-[rgb(70,82,94)]"}`}
        >
          {status.msg ?? ""}
        </p>
      </div>
    </div>
  );
}
