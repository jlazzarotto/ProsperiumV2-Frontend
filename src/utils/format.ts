export const formatCurrency = (value: number | string): string => {
  if (typeof value === "string") {
    // If already a formatted string with R$, return as is
    if (value.includes("R$")) return value

    // Try to convert to number
    const numericValue = Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numericValue)
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

/**
 * Applies currency mask as user types
 * @param value The input value
 * @returns Formatted currency string
 */
export const applyCurrencyMask = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, "")

  // Convert to number and divide by 100 to get decimal value
  const floatValue = Number.parseInt(numericValue || "0", 10) / 100

  // Format as currency
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue)
}

/**
 * Extracts numeric value from formatted currency string
 * @param formattedValue Formatted currency string (e.g., "R$ 1.234,56")
 * @returns Number value (e.g., 1234.56)
 */
export const extractNumericValue = (formattedValue: string): number => {
  return Number.parseFloat(formattedValue.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
}