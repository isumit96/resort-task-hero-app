
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // For file inputs on Android, use a specific styling approach to improve WebView compatibility
    const isFileInput = type === 'file';
    const isAndroidWebView = /Android/.test(navigator.userAgent) && 
                             (/wv/.test(navigator.userAgent) || 
                              /Version\/[0-9.]+/.test(navigator.userAgent) ||
                              /Android.*Mobile.*Chrome\/[.0-9]* (?!Mobile)/i.test(navigator.userAgent));
    
    // Android WebView file inputs need special handling - make it full-screen with opacity 0
    // but NOT display:none as that can cause issues with some Android WebViews
    const fileInputStyle = isFileInput && isAndroidWebView 
      ? "opacity-0 absolute top-0 left-0 w-full h-full z-50 cursor-pointer touch-manipulation" 
      : "";
    
    // For Android WebView file inputs, ensure capture attribute is set properly
    const inputProps = {...props};
    if (isFileInput && isAndroidWebView) {
      if (inputProps.accept === 'image/*' || inputProps.accept?.includes('image/')) {
        inputProps['capture'] = 'environment';
      } else if (inputProps.accept === 'video/*' || inputProps.accept?.includes('video/')) {
        inputProps['capture'] = 'environment';
      }
    }
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
          fileInputStyle,
          className
        )}
        ref={ref}
        {...inputProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
