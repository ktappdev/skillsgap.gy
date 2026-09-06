"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 transition-colors duration-150";

export function SubmitButton({ children, pendingLabel = "Working…", className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const disabled = pending || props.disabled;

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={disabled}
      aria-disabled={disabled}
      className={className ? `${baseClasses} ${className}` : baseClasses}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
