"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "calm";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-kid transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700":
              variant === "primary",
            "bg-yolk-400 text-white hover:bg-yolk-500 active:bg-yolk-500":
              variant === "secondary",
            "border-2 border-primary-300 text-primary-700 hover:bg-primary-50":
              variant === "outline",
            "text-primary-600 hover:bg-primary-50": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
            "bg-calm-400 text-white hover:bg-calm-500": variant === "calm",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-5 py-2.5 text-base": size === "md",
            "px-7 py-3.5 text-kid-base": size === "lg",
            "px-8 py-5 text-kid-lg min-h-[4rem]": size === "xl",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
