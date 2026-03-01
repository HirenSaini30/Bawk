import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        {
          "bg-primary-100 text-primary-700": variant === "default",
          "bg-calm-100 text-calm-500": variant === "success",
          "bg-yolk-100 text-yolk-500": variant === "warning",
          "bg-primary-50 text-primary-600": variant === "info",
          "bg-gray-100 text-gray-600": variant === "muted",
        },
        className
      )}
      {...props}
    />
  );
}
