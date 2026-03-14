"use client"

import type React from "react"

import { toast, type ToastOptions, type ToastContent } from "react-toastify"

interface CustomToastOptions {
  position?: ToastOptions["position"]
  autoClose?: ToastOptions["autoClose"]
  hideProgressBar?: ToastOptions["hideProgressBar"]
  closeOnClick?: ToastOptions["closeOnClick"]
  pauseOnHover?: ToastOptions["pauseOnHover"]
  draggable?: ToastOptions["draggable"]
  theme?: ToastOptions["theme"]
  style?: React.CSSProperties
  className?: string
  options?: ToastOptions
}

interface ShowToastProps {
  content: ToastContent
  type?: "success" | "error" | "info" | "warning" | "default"
  style?: React.CSSProperties
  className?: string
  options?: ToastOptions
}

export const useToast = () => {
  const showToast = ({ content, type = "default", style, className, options }: ShowToastProps) => {
    const toastOptions: ToastOptions = {
      style,
      className,
      ...options,
    }

    switch (type) {
      case "success":
        toast.success(content, toastOptions)
        break
      case "error":
        toast.error(content, toastOptions)
        break
      case "info":
        toast.info(content, toastOptions)
        break
      case "warning":
        toast.warning(content, toastOptions)
        break
      default:
        toast(content, toastOptions)
        break
    }
  }

  return { showToast }
}

const convertOptions = (options?: CustomToastOptions): ToastOptions => {
  if (!options) return {}

  const { style, className, ...restOptions } = options

  return {
    ...restOptions,
    style,
    className,
  }
}

const customToast = {
  success(content: ToastContent, options?: CustomToastOptions) {
    return toast.success(content, convertOptions(options))
  },

  error(content: ToastContent, options?: CustomToastOptions) {
    return toast.error(content, convertOptions(options))
  },

  info(content: ToastContent, options?: CustomToastOptions) {
    return toast.info(content, convertOptions(options))
  },

  warning(content: ToastContent, options?: CustomToastOptions) {
    return toast.warning(content, convertOptions(options))
  },

  default(content: ToastContent, options?: CustomToastOptions) {
    return toast(content, convertOptions(options))
  },

  closeAll() {
    toast.dismiss()
  },

  close(id?: string | number) {
    toast.dismiss(id)
  },

  update(id: string | number, options: { content?: ToastContent; options?: CustomToastOptions }) {
    if (options.content) {
      toast.update(id, {
        render: options.content,
        ...convertOptions(options.options),
      })
    } else {
      toast.update(id, convertOptions(options.options) as ToastOptions)
    }
  },
}

export default customToast
