
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant} className="group z-[9999] shadow-lg dark:shadow-black/20">
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={variant === 'destructive' ? 'font-medium' : ''}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="opacity-70 group-hover:opacity-100 transition-opacity" />
          </Toast>
        )
      })}
      <ToastViewport className="p-4 pb-16 z-[100] max-w-[90vw] max-h-screen overflow-y-auto fixed bottom-0 right-0 flex flex-col gap-2" />
    </ToastProvider>
  )
}
