"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ActionState = { error?: string; ok?: boolean; message?: string };

export function ActionForm({
  action,
  submitLabel,
  successMessage = "Salvo.",
  children,
  className,
  resetOnSuccess = true,
  onSuccess,
  submitVariant = "default",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
  submitVariant?: "default" | "secondary" | "outline";
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(state.message ?? successMessage);
    if (resetOnSuccess) ref.current?.reset();
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className ?? "space-y-3"}>
      {children}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" variant={submitVariant} disabled={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

/** Campo com rótulo, para formulários simples. */
export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  className,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} name={name} type={type} required={required} defaultValue={defaultValue ?? undefined} placeholder={placeholder} className="field" {...rest} />
    </div>
  );
}
