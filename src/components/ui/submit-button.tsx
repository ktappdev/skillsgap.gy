"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
};

export function SubmitButton({ children, pendingLabel = "Working…", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={pending || props.disabled}
      aria-disabled={pending || props.disabled}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
