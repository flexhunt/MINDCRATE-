"use client"

import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast/use-toast"
import { useToast as useToastHook } from "@/components/ui/toast/use-toast"

export { Toast, ToastClose, ToastDescription, ToastTitle, ToastProvider, ToastViewport }

export function useToast() {
  return useToastHook()
}

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

export type { ToastProps }

function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ ...props }) => (
        <Toast key={props.id} {...props}>
          <ToastTitle>{props.title}</ToastTitle>
          {props.description && <ToastDescription>{props.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

export { Toaster }

const ToastContext = React.createContext({
  toast: (props: any) => {},
})

export const ToastProvider2 = ToastContext.Provider

export function toast(props: any) {
  const { toast: toastHook } = React.useContext(ToastContext)
  toastHook(props)
}
