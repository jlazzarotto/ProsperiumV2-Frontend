import type { ImportProfile } from "../types"
import { planoContasProfile } from "./plano-contas-profile"

export const importProfiles: Record<string, ImportProfile> = {
  planoContas: planoContasProfile,
}

export function getProfileById(id: string): ImportProfile | undefined {
  return importProfiles[id]
}
