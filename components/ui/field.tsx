"use client";

import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label, error, hint, required, children, className,
}: {
  label?: string; error?: string; hint?: string; required?: boolean;
  children: (id: string) => React.ReactNode; className?: string;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-center justify-between">
          <span className="label-tech !text-[9.5px] !tracking-[0.2em]">
            {label} {required && <em className="not-italic text-crimson">*</em>}
          </span>
          {hint && !error && <span className="text-[10px] text-ash">{hint}</span>}
        </span>
      )}
      {children(id)}
      <span
        role={error ? "alert" : undefined}
        className={cn(
          "mt-1 block text-[11px] text-ember transition-all duration-200",
          error ? "translate-y-0 opacity-100" : "pointer-events-none h-0 -translate-y-1 opacity-0"
        )}
      >
        {error}
      </span>
    </label>
  );
}

export const inputCls =
  "peer w-full rounded-sm border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-[13.5px] text-snow placeholder:text-ash/60 transition-all duration-200 focus:border-crimson/70 focus:bg-crimson/[0.04] focus:shadow-[0_0_0_3px_rgba(215,25,32,0.12)] focus:outline-none aria-[invalid=true]:border-ember/60";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => (
    <input ref={ref} {...p} className={cn(inputCls, className)} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => (
    <textarea ref={ref} {...p} className={cn(inputCls, "min-h-24 resize-y", className)} />
  )
);
Textarea.displayName = "Textarea";

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <Input {...props} type={show ? "text" : "password"} className={cn(props.className, "pr-11")} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-ash transition-colors hover:bg-white/10 hover:text-white"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  );
}

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select {...p} className={cn(inputCls, "appearance-none pr-9", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash transition-transform peer-focus:rotate-180" />
    </span>
  );
}
