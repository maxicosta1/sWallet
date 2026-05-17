import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:bg-[#7dffb1]",
        coral: "bg-coral text-coral-foreground hover:-translate-y-0.5 hover:bg-[#ff704e]",
        ghost: "border border-white/10 bg-white/[0.055] text-white hover:border-primary/50 hover:bg-primary/10",
        danger: "border border-red-400/25 bg-red-500/15 text-red-100 hover:bg-red-500/20",
        subtle: "bg-white/[0.045] text-muted-foreground hover:bg-white/[0.08] hover:text-white"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { buttonVariants };
