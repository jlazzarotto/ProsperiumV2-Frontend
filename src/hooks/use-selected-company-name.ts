import { useEffect, useState } from "react"

/**
 * Hook para ler o nome da company selecionada do sessionStorage
 * Usado pelo MainHeader para exibir o nome no banner
 */
export function useSelectedCompanyName() {
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    const handleStorageChange = () => {
      const selectedData = sessionStorage.getItem("prosperium_selected_company_name")
      setCompanyName(selectedData)
    }

    const handleCustomEvent = (e: Event) => {
      if (e instanceof CustomEvent) {
        setCompanyName(e.detail)
      }
    }

    // Ler no carregamento
    handleStorageChange()

    // Ouvir mudanças via storage event (para sincronização entre abas)
    window.addEventListener("storage", handleStorageChange)
    // Ouvir custom event (para mudanças na mesma aba)
    window.addEventListener("companyNameChanged", handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("companyNameChanged", handleCustomEvent)
    }
  }, [])

  return companyName
}
