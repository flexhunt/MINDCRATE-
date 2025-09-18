"use client"

import * as React from "react"

type ToastAction = {
  altText?: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastAction
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  type?: "default" | "destructive"
  className?: string
}

type ToastState = {
  toasts: ToastProps[]
  addToast: (toast: Omit<ToastProps, "id">) => void
  updateToast: (id: string, toast: Partial<ToastProps>) => void
  removeToast: (id: string) => void
}

const DEFAULT_DURATION = 3000

const useToast = () => {
  const [state, setState] = React.useState<ToastState>({
    toasts: [],
    addToast: (toast) =>
      setState((prevState) => ({
        ...prevState,
        toasts: [...prevState.toasts, { id: String(Math.random()), ...toast }],
      })),
    updateToast: (id, toast) =>
      setState((prevState) => ({
        ...prevState,
        toasts: prevState.toasts.map((t) => (t.id === id ? { ...t, ...toast } : t)),
      })),
    removeToast: (id) =>
      setState((prevState) => ({
        ...prevState,
        toasts: prevState.toasts.filter((t) => t.id !== id),
      })),
  })

  return state
}

// Add a toast function that can be imported directly
const toast = (props: Omit<ToastProps, "id">) => {
  // This is a client-side only function
  if (typeof window === "undefined") {
    return
  }

  // Find the toast context in the DOM
  const toastContext = document.querySelector("[data-toast-context]")
  if (!toastContext) {
    console.error("Toast context not found. Make sure ToastProvider is mounted.")
    return
  }

  // Dispatch a custom event to add the toast
  const event = new CustomEvent("toast", { detail: props })
  toastContext.dispatchEvent(event)
}

type ToastContextProps = {
  children: React.ReactNode
}

const ToastContext = React.createContext<ReturnType<typeof useToast> | null>(null)

const ToastProvider = ({ children }: ToastContextProps) => {
  const toast = useToast()

  // Add a data attribute to identify the toast context
  React.useEffect(() => {
    const element = document.querySelector("[data-toast-provider]")
    if (element) {
      element.setAttribute("data-toast-context", "true")

      // Listen for toast events
      const handleToast = (event: CustomEvent) => {
        toast.addToast(event.detail)
      }

      element.addEventListener("toast" as any, handleToast as any)

      return () => {
        element.removeEventListener("toast" as any, handleToast as any)
      }
    }
  }, [toast])

  return <div data-toast-provider>{children}</div>
}

function useToastContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, children, type, ...props }, ref) => {
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
})
Toast.displayName = "Toast"

const ToastTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={className} {...props} />
  },
)
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={className} {...props} />
  },
)
ToastDescription.displayName = "ToastDescription"

const ToastClose = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return <button ref={ref} className={className} {...props} />
  },
)
ToastClose.displayName = "ToastClose"

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={className} {...props} />
  },
)
ToastViewport.displayName = "ToastViewport"

export { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, useToast, toast }
