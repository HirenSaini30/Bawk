import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-kid border border-tan-200 px-4 py-3 text-base",
        "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400",
        "placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-kid border border-tan-200 px-4 py-3 text-base min-h-[120px] resize-y",
      "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400",
      "placeholder:text-gray-400 disabled:bg-gray-100",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-kid border border-tan-200 px-4 py-3 text-base bg-white",
      "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Input, Textarea, Select };
