"use client";

import { useId, useState } from "react";

/**
 * Blog subscription section. Polished + accessible (labelled input, inline
 * validation, aria-live status). HONEST: there is no newsletter backend wired
 * up yet, so a valid submit does NOT claim success — it shows a clear
 * "not connected yet" notice instead of faking a signup. When a real endpoint
 * exists, replace the `onSubmit` body with the POST and switch to a success
 * state. See the final report.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Status = { kind: "idle" | "error" | "notice"; msg?: string };

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const id = useId();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setStatus({ kind: "error", msg: "Please enter a valid email address." });
      return;
    }
    // No newsletter provider connected — do NOT fake a subscription.
    setStatus({ kind: "notice", msg: "Thanks! Email updates aren’t connected yet — we’ll be in touch once they launch." });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="w-full bg-rebm-blue/10">
      <div className="mx-auto max-w-[1400px] px-[24px] py-[64px] sm:px-[40px]">
        <div className="mx-auto max-w-[620px] text-center">
          <h2 id={`${id}-title`} className="text-[26px] leading-[32px] font-bold text-rebm-navy sm:text-[32px] sm:leading-[38px]">
            Stay ahead of the market
          </h2>
          <p className="mt-[12px] text-[16px] leading-[25px] text-[rgb(70,82,94)]">
            Get REBM’s commercial real estate insights and Market Pulse updates in your inbox.
          </p>

          <form onSubmit={onSubmit} noValidate className="mx-auto mt-[28px] flex max-w-[520px] flex-col gap-[10px] sm:flex-row">
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
              className="w-full rounded-full border border-rebm-card-border bg-white px-[20px] py-[13px] text-[15px] outline-none focus:border-rebm-blue"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-rebm-navy px-[28px] py-[13px] text-[15px] font-medium text-white shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none"
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
    </section>
  );
}
