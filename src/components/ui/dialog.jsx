import * as React from "react"
import { cn } from "../../lib/utils"

const Dialog = ({ children, open, onOpenChange, ...props }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div {...props}>
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ className, children, size = "default", ...props }) => (
  <div
    className={cn(
      "relative bg-background rounded-lg shadow-lg overflow-hidden",
      {
        "max-w-md w-full": size === "default",
        "max-w-lg w-full": size === "lg",
        "max-w-xl w-full": size === "xl",
      },
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex justify-between items-center px-6 py-4 border-b", className)}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }) => (
  <h2
    className={cn("text-lg font-medium", className)}
    {...props}
  />
)

export { Dialog, DialogContent, DialogHeader, DialogTitle }