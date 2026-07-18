"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { submitContact } from "@/app/contact/actions";
import { contactSchema, type ContactInput } from "@/lib/contact/validation";

type Status = "idle" | "submitting" | "success" | "error";

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

const EMPTY: ContactInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isBroker: "no",
  message: "",
  company: "",
};

export function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const uid = useId();

  const set = <K extends keyof ContactInput>(key: K, v: ContactInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // prevent duplicate submit
    setFormError(null);

    const local = contactSchema.safeParse(values);
    if (!local.success) {
      const fe: Record<string, string> = {};
      for (const i of local.error.issues) {
        const k = i.path.length ? String(i.path[0]) : "form";
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      // Move focus to the first invalid field so keyboard/AT users land on the
      // error rather than having to hunt for it after pressing Send.
      const order = ["firstName", "lastName", "email", "phone", "isBroker", "message"];
      const firstBad = order.find((k) => fe[k]);
      if (firstBad) {
        const id = FIELD_IDS[firstBad];
        requestAnimationFrame(() => {
          document.getElementById(`${uid}-${id}`)?.focus();
        });
      }
      return;
    }

    setStatus("submitting");
    const res = await submitContact(values);
    if (res.ok) {
      setStatus("success");
    } else {
      setStatus("error");
      setFormError(res.error);
      setErrors(res.fieldErrors ?? {});
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-[20px] bg-white p-[40px] text-center shadow-sm">
        <div className="mx-auto mb-[16px] flex size-[52px] items-center justify-center rounded-full bg-[#E4F4EA] text-[26px] text-[#1B7A43]">
          ✓
        </div>
        <h2 className="text-[24px] font-bold text-rebm-navy">Thanks — message received</h2>
        <p className="mx-auto mt-[8px] max-w-[420px] text-[15px] text-[rgb(60,70,80)]">
          We’ll be in touch shortly. For anything urgent you can also call{" "}
          <a href="tel:+18008415033" className="text-rebm-link underline">
            (800) 841-5033
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[24px] bg-white p-[28px] shadow-sm sm:p-[40px]"
    >
      <div className="grid gap-[20px] sm:grid-cols-2">
        <TextField id={`${uid}-first`} label="First Name" required value={values.firstName} placeholder="John" error={errors.firstName} onChange={(v) => set("firstName", v)} autoComplete="given-name" />
        <TextField id={`${uid}-last`} label="Last Name" required value={values.lastName} placeholder="Doe" error={errors.lastName} onChange={(v) => set("lastName", v)} autoComplete="family-name" />
        <TextField id={`${uid}-email`} label="Your Email" required type="email" value={values.email} placeholder="johndoe@gmail.com" error={errors.email} onChange={(v) => set("email", v)} autoComplete="email" />
        <TextField id={`${uid}-phone`} label="Your Phone" required type="tel" value={values.phone} placeholder="(800) 841-5033" error={errors.phone} onChange={(v) => set("phone", v)} autoComplete="tel" />
      </div>

      <fieldset
        className="mt-[24px]"
        aria-describedby={errors.isBroker ? `${uid}-isBroker-err` : undefined}
      >
        <legend className="text-[15px] font-medium text-rebm-navy">
          Are you a real estate agent or broker? <span className="text-rebm-blue">*</span>
        </legend>
        <div className="mt-[10px] flex gap-[10px]">
          {(["no", "yes"] as const).map((opt, i) => (
            <button
              key={opt}
              id={i === 0 ? `${uid}-isBroker` : undefined}
              type="button"
              aria-pressed={values.isBroker === opt}
              onClick={() => set("isBroker", opt)}
              className={`rounded-full px-[26px] py-[11px] text-[15px] font-medium capitalize transition-[transform,background-color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:outline-none motion-reduce:transition-none ${
                values.isBroker === opt
                  ? "bg-rebm-navy text-white"
                  : "bg-[#EEF1F4] text-rebm-navy hover:bg-[#E4E9EE]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {errors.isBroker && (
          <p id={`${uid}-isBroker-err`} className="mt-[6px] text-[13px] text-red-600">
            {errors.isBroker}
          </p>
        )}
      </fieldset>

      <div className="mt-[24px]">
        <label htmlFor={`${uid}-msg`} className="text-[15px] font-medium text-rebm-navy">
          Your Message
        </label>
        <textarea
          id={`${uid}-msg`}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          rows={5}
          placeholder="How can we help you?"
          className="mt-[8px] w-full rounded-[16px] bg-[#F4F6F8] px-[16px] py-[13px] text-[15px] text-black outline-none focus:ring-2 focus:ring-rebm-blue"
        />
      </div>

      {/* Honeypot — visually hidden and off the tab order; bots fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={values.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </label>
      </div>

      {formError && (
        <p role="alert" className="mt-[18px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-[24px] w-full rounded-full bg-rebm-navy px-[28px] py-[14px] text-[16px] font-semibold text-white transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-blue focus-visible:outline-none active:scale-[0.98] disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
      >
        {status === "submitting" ? "Sending…" : "Send Message"}
      </button>

      <p className="mt-[16px] text-center text-[13px] text-[rgb(90,100,110)]">
        By submitting this form, you agree to our{" "}
        <Link href="/privacy" className="text-rebm-navy underline">
          Privacy Policy
        </Link>
        .
      </p>
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
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-medium text-rebm-navy">
        {label} {required && <span className="text-rebm-blue">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required={required ? "true" : undefined}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-[8px] w-full rounded-[16px] bg-[#F4F6F8] px-[16px] py-[13px] text-[15px] text-black outline-none focus:ring-2 focus:ring-rebm-blue ${
          error ? "ring-2 ring-red-400" : ""
        }`}
      />
      {error && (
        <p id={`${id}-err`} className="mt-[6px] text-[13px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
