"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Container } from "@/components/Container";
import { subscribeNewsletter } from "@/app/newsletter/actions";
import { newsletterSchema, type NewsletterFormValues } from "@/lib/newsletter/validation";

/**
 * "Subscribe to our email list" — the wide pale-blue newsletter band shown at
 * the bottom of every article, above "You May Also Like". Left: heading + copy;
 * right: Full Name + Email inputs and a full-width Subscribe button. Stacks on
 * mobile.
 *
 * HONEST + future-ready: submits through the `subscribeNewsletter` server action.
 * When the newsletter backend (Resend audience) is configured it performs a REAL
 * signup and shows a real success; when it isn't, it shows a neutral "not live
 * yet" notice rather than faking success. States: idle → submitting → success |
 * pending | error.
 */
type Status = "idle" | "submitting" | "success" | "pending" | "error";

const EMPTY: NewsletterFormValues = { fullName: "", email: "", website: "" };

const FIELD =
  "w-full rounded-full border border-transparent bg-white px-[24px] py-[16px] text-[16px] text-rebm-navy shadow-[0_1px_2px_rgba(3,44,64,0.06)] outline-none transition-[box-shadow,border-color] duration-200 placeholder:text-[rgb(120,138,156)] focus:border-rebm-blue focus:ring-2 focus:ring-rebm-blue/40 motion-reduce:transition-none";

export function NewsletterSection() {
  const [values, setValues] = useState<NewsletterFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const uid = useId();
  const doneRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the confirmation once it renders so keyboard / screen-reader
  // users land on it instead of on the now-hidden form.
  useEffect(() => {
    if (status === "success" || status === "pending") doneRef.current?.focus();
  }, [status]);

  const set = (key: keyof NewsletterFormValues, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
    if (status === "error") {
      setStatus("idle");
      setFormError(null);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return; // guard against double submit
    setFormError(null);

    const local = newsletterSchema.safeParse(values);
    if (!local.success) {
      const fe: Record<string, string> = {};
      for (const i of local.error.issues) {
        const k = i.path.length ? String(i.path[0]) : "form";
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      const firstBad = ["fullName", "email"].find((k) => fe[k]);
      if (firstBad) requestAnimationFrame(() => document.getElementById(`${uid}-${firstBad}`)?.focus());
      return;
    }

    setStatus("submitting");
    const res = await subscribeNewsletter(values);
    if (res.ok) {
      setStatus(res.delivered ? "success" : "pending");
      setValues(EMPTY);
      setErrors({});
    } else {
      setStatus("error");
      setFormError(res.error);
      setErrors(res.fieldErrors ?? {});
    }
  }

  const done = status === "success" || status === "pending";

  return (
    <section aria-labelledby={`${uid}-title`} className="bg-white pt-[12px] pb-[56px] sm:pb-[64px]">
      <Container>
        {/* Aligned EXACTLY to the article body: same Container + max-w-[760px]
            centered as /blog/[slug]'s prose column, so the panel's left/right
            edges match the article text (not the viewport). */}
        <div className="mx-auto max-w-[760px]">
          <div className="grid gap-[28px] rounded-[28px] bg-rebm-newsletter px-[28px] py-[32px] sm:px-[40px] sm:py-[40px] lg:grid-cols-2 lg:items-center lg:gap-[40px] lg:px-[48px] lg:py-[44px]">
            {/* Left — heading + supporting copy */}
            <div>
              <h2
                id={`${uid}-title`}
                className="text-[32px] leading-[38px] font-bold tracking-[-0.01em] text-rebm-navy sm:text-[36px] sm:leading-[42px]"
              >
                Subscribe
                <br />
                to our email list
              </h2>
              <p className="mt-[18px] max-w-[420px] text-[17px] leading-[27px] text-[rgb(47,68,86)] sm:text-[19px] sm:leading-[30px]">
                Join our newsletter to get exclusive insights, updates and expert tips.
              </p>
            </div>

            {/* Right — form, or the confirmation once submitted */}
            <div>
              {done ? (
                <div className="flex items-start gap-[14px] rounded-[20px] bg-white/70 px-[24px] py-[22px]">
                  <span
                    aria-hidden="true"
                    className="mt-[1px] flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#E4F4EA] text-[20px] text-[#1B7A43]"
                  >
                    ✓
                  </span>
                  <p
                    ref={doneRef}
                    tabIndex={-1}
                    role="status"
                    className="text-[16px] leading-[25px] text-rebm-navy outline-none"
                  >
                    {status === "success" ? (
                      <>
                        <strong className="font-semibold">You’re subscribed.</strong> Thanks for joining —
                        expect exclusive insights and updates in your inbox.
                      </>
                    ) : (
                      <>
                        <strong className="font-semibold">Thanks!</strong> Email updates aren’t live just
                        yet — we’ve noted your interest and will add you the moment they launch.
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[16px]">
                  <div>
                    <label htmlFor={`${uid}-fullName`} className="sr-only">
                      Full Name
                    </label>
                    <input
                      id={`${uid}-fullName`}
                      type="text"
                      autoComplete="name"
                      placeholder="Full Name"
                      value={values.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      aria-required="true"
                      aria-invalid={errors.fullName ? "true" : undefined}
                      aria-describedby={errors.fullName ? `${uid}-fullName-err` : undefined}
                      className={`${FIELD} ${errors.fullName ? "border-red-400 ring-2 ring-red-300" : ""}`}
                    />
                    {errors.fullName && (
                      <p id={`${uid}-fullName-err`} className="mt-[6px] px-[8px] text-[13px] text-red-700">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`${uid}-email`} className="sr-only">
                      Email Address
                    </label>
                    <input
                      id={`${uid}-email`}
                      type="email"
                      autoComplete="email"
                      placeholder="Email Address"
                      value={values.email}
                      onChange={(e) => set("email", e.target.value)}
                      aria-required="true"
                      aria-invalid={errors.email ? "true" : undefined}
                      aria-describedby={errors.email ? `${uid}-email-err` : undefined}
                      className={`${FIELD} ${errors.email ? "border-red-400 ring-2 ring-red-300" : ""}`}
                    />
                    {errors.email && (
                      <p id={`${uid}-email-err`} className="mt-[6px] px-[8px] text-[13px] text-red-700">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="mt-[2px] w-full rounded-full bg-rebm-navy px-[28px] py-[17px] text-[17px] font-semibold text-white transition-[transform,box-shadow] duration-200 ease-out hover:shadow-lg focus-visible:ring-2 focus-visible:ring-rebm-navy focus-visible:ring-offset-2 focus-visible:ring-offset-rebm-newsletter focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    {status === "submitting" ? "Subscribing…" : "Subscribe"}
                  </button>

                  {formError && (
                    <p role="alert" className="rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[14px] text-red-700">
                      {formError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
