import { InputHTMLAttributes, forwardRef } from "react";

export type InputVariant = "default" | "inline";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  className?: string;
}

/**
 * Unified Input Component
 *
 * Variants:
 * - default: Standard text input
 * - inline: Inline editing style (for clues, names, etc.)
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "default", className = "", ...props }, ref) => {
    const variantClass = {
      default: "",
      inline: "input-inline",
    }[variant];

    // Special handling for specific input types
    const typeClass = (() => {
      if (props.placeholder?.toLowerCase().includes("clue")) {
        return "clue-input-inline";
      }
      if (props.placeholder?.toLowerCase().includes("name")) {
        return "name-input-inline";
      }
      return "";
    })();

    const classes = [variantClass, typeClass, className]
      .filter(Boolean)
      .join(" ");

    return (
      <input
        ref={ref}
        className={classes || undefined}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";


