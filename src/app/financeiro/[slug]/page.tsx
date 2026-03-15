import { notFound } from "next/navigation"
import { ModulePlaceholderPage } from "@/components/module-placeholder-page"
import { MODULE_PLACEHOLDERS } from "@/lib/module-placeholders"

export default function FinanceiroPlaceholderPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const key = `financeiro/${slug}`
  const config = MODULE_PLACEHOLDERS[key]

  if (!config) {
    notFound()
  }

  return <ModulePlaceholderPage {...config} />
}
