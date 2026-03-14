/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pendente":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
    case "pago":
    case "baixado":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
    case "cancelado":
      return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30"
  }
}

export function getTypeColor(type: string): string {
  if (type === "entrada" || type === "Entrada") {
    return "text-emerald-700 dark:text-emerald-400"
  }
  return "text-rose-700 dark:text-rose-400"
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function formatMonthDisplay(monthYear: string): string {
  const year = monthYear.slice(0, 4);
  const month = monthYear.slice(4, 6);
  return `${month}/${year}`;
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return "-"

  try {
    // Handle Firestore Timestamp objects
    if (typeof dateString === "object" && dateString !== null && "seconds" in dateString) {
      // @ts-ignore - Firestore timestamp object
      return new Date(dateString.seconds * 1000).toLocaleDateString("pt-BR")
    }

    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "-"
    }

    return date.toLocaleDateString("pt-BR")
  } catch (error) {
    console.error("Error formatting date:", error)
    return "-"
  }
}

