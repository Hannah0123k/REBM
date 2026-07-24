"use client";

import { useEffect, useId, useRef, useState } from "react";

import { submitContact } from "@/app/contact/actions";
import { PillButton } from "@/components/PillButton";
import { contactSchema, type ContactFormValues } from "@/lib/contact/validation";

/** Format digits as a US phone number: (XXX) XXX-XXXX, progressively as typed. */
function formatPhone(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isBroker: "",
  heardAbout: "",
  message: "",
  website: "",
};

// Maps a field key to the id suffix of its focusable control, so a failed
// submit can move focus to the first invalid one.
const FIELD_IDS: Record<string, string> = {
  firstName: "first",
  lastName: "last",
  email: "email",
  phone: "phone",
  isBroker: "isBroker",
  message: "msg",
};

// Shared input styling: a light blue-gray fill that brightens to white on focus
// with a clear blue ring. Transition is transform/opacity-free (color + shadow).
const FIELD_BASE =
  "mt-[7px] w-full rounded-[14px] bg-[#F4F7FB] px-[15px] py-[13px] text-[15px] text-black outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-[rgb(142,152,164)] focus:bg-white focus:ring-2 focus:ring-rebm-blue motion-reduce:transition-none";
const LABEL = "text-[14px] font-medium text-rebm-navy";
const ERR = "mt-[6px] text-[13px] text-red-600 rebm-fade-in";

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const uid = useId();
  const successRef = useRef<HTMLHeadingElement>(null);

  // On success the tall form is replaced by the short confirmation card, which
  // shrinks the page — so the old scroll position (near the Send button) would
  // leave the thank-you opening mid/low and appearing to scroll up. Jump to the
  // top instantly, then move focus to the heading for keyboard/screen-reader
  // users (the form is gone) so they aren't stranded.
  useEffect(() => {
    if (status !== "success") return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto"; // hold instant across the settle window
    window.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    const restore = setTimeout(() => {
      html.style.scrollBehavior = prev;
    }, 300);
    successRef.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(restore);
    };
  }, [status]);

  const set = <K extends keyof ContactFormValues>(key: K, v: ContactFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting" || status === "success") return; // prevent duplicate submit
    setFormError(null);

    const local = contactSchema.safeParse(values);
    if (!local.success) {
      const fe: Record<string, string> = {};
      for (const i of local.error.issues) {
        const k = i.path.length ? String(i.path[0]) : "form";
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      const order = ["firstName", "lastName", "email", "phone", "isBroker", "message"];
      const firstBad = order.find((k) => fe[k]);
      if (firstBad) {
        const id = FIELD_IDS[firstBad];
        requestAnimationFrame(() => document.getElementById(`${uid}-${id}`)?.focus());
      }
      return;
    }

    setStatus("submitting");
    const res = await submitContact(values);
    if (res.ok) {
      setStatus("success");
    } else {
      // Keep entered values so nothing is lost on failure.
      setStatus("error");
      setFormError(res.error);
      setErrors(res.fieldErrors ?? {});
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rebm-fade-in-slow flex min-h-[360px] flex-col items-center justify-center rounded-[24px] bg-white p-[36px] text-center shadow-[0_18px_48px_-24px_rgba(3,44,64,0.30)] sm:p-[48px]"
      >
        <div className="mb-[18px] flex size-[52px] items-center justify-center rounded-full bg-[#E4F4EA] text-[26px] text-[#1B7A43]">
          ✓
        </div>
        <h2 ref={successRef} tabIndex={-1} className="text-[22px] font-bold text-rebm-navy outline-none sm:text-[26px]">
          Thank you! We received your message and will be in touch soon.
        </h2>
        <p className="mt-[12px] max-w-[440px] text-[15px] leading-[23px] text-[rgb(60,70,80)]">
          In the meantime, feel free to explore our latest articles.
        </p>
        <PillButton href="/blog" className="mt-[26px] text-[16px] leading-[24px]">
          Explore Latest Articles
        </PillButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[24px] bg-white p-[24px] shadow-[0_18px_48px_-24px_rgba(3,44,64,0.28)] sm:p-[32px]"
    >
      <div className="grid gap-[16px] sm:grid-cols-2">
        <TextField id={`${uid}-first`} label="First Name" required value={values.firstName} placeholder="John" error={errors.firstName} onChange={(v) => set("firstName", v)} autoComplete="given-name" />
        <TextField id={`${uid}-last`} label="Last Name" required value={values.lastName} placeholder="Doe" error={errors.lastName} onChange={(v) => set("lastName", v)} autoComplete="family-name" />
        <TextField id={`${uid}-email`} label="Email" required type="email" value={values.email} placeholder="john@example.com" error={errors.email} onChange={(v) => set("email", v)} autoComplete="email" />
        <TextField id={`${uid}-phone`} label="Phone" required type="tel" inputMode="tel" value={values.phone} placeholder="(123) 456-7891" error={errors.phone} onChange={(v) => set("phone", formatPhone(v))} autoComplete="tel" />
      </div>

      <div className="mt-[22px] grid gap-[16px] sm:grid-cols-2 sm:items-start">
        {/* Yes/No — pill-styled, but backed by real radio inputs for accessibility.
            The group is required; that's conveyed on the radiogroup, not each radio
            (aria-required isn't valid on role=radio). Pills cross-fade on change. */}
        <fieldset>
          <legend className={LABEL}>
            Are you a real estate agent or broker? <span className="text-rebm-blue">*</span>
          </legend>
          <div
            role="radiogroup"
            aria-label="Are you a real estate agent or broker?"
            aria-required="true"
            aria-describedby={errors.isBroker ? `${uid}-isBroker-err` : undefined}
            className="mt-[9px] flex gap-[10px]"
          >
            {(["yes", "no"] as const).map((opt, i) => {
              const selected = values.isBroker === opt;
              return (
                <label key={opt} className="cursor-pointer">
                  <input
                    id={i === 0 ? `${uid}-isBroker` : undefined}
                    type="radio"
                    name={`${uid}-isBroker`}
                    value={opt}
                    checked={selected}
                    onChange={() => set("isBroker", opt)}
                    className="peer sr-only"
                  />
                  <span
                    className={`block rounded-full px-[28px] py-[11px] text-[15px] font-medium capitalize transition-[background-color,color,box-shadow] duration-200 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-rebm-blue peer-focus-visible:ring-offset-2 motion-reduce:transition-none ${
                      selected
                        ? "bg-rebm-navy text-white shadow-[0_6px_16px_-6px_rgba(3,44,64,0.5)]"
                        : "bg-[#EEF2F7] text-rebm-navy hover:bg-[#E4E9EF]"
                    }`}
                  >
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.isBroker && (
            <p id={`${uid}-isBroker-err`} className={ERR}>
              {errors.isBroker}
            </p>
          )}
        </fieldset>

        <TextField
          id={`${uid}-heard`}
          label="How did you find Real Estate Broker Match?"
          value={values.heardAbout}
          placeholder="e.g. Attorney, CPA, other"
          error={errors.heardAbout}
          onChange={(v) => set("heardAbout", v)}
        />
      </div>

      <div className="mt-[22px]">
        <label htmlFor={`${uid}-msg`} className={LABEL}>
          Message <span className="text-rebm-blue">*</span>
        </label>
        <textarea
          id={`${uid}-msg`}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          rows={3}
          placeholder="How can we help you?"
          aria-required="true"
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? `${uid}-msg-err` : undefined}
          className={`${FIELD_BASE} resize-none ${errors.message ? "ring-2 ring-red-400" : ""}`}
        />
        {errors.message && (
          <p id={`${uid}-msg-err`} className={ERR}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot — visually hidden and off the tab order; bots fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      {formError && (
        <p role="alert" className="rebm-fade-in mt-[18px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-[22px] w-full rounded-full bg-rebm-navy px-[28px] py-[15px] text-[16px] font-semibold text-white transition-[transform,box-shadow] duration-200 ease-out hover:scale-[1.03] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label} {required && <span className="text-rebm-blue">*</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required={required ? "true" : undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_BASE} ${error ? "ring-2 ring-red-400" : ""}`}
      />
      {error && (
        <p id={`${id}-err`} className={ERR}>
          {error}
        </p>
      )}
    </div>
  );
}
