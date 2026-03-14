import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        {...props}
        className={cn(
          "flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-sm " +
          "transition-[border-color,box-shadow] duration-150 " +
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground " +
          "placeholder:text-muted-foreground/70 " +
          "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border border-input " +
          "hover:border-input/80 " +
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
