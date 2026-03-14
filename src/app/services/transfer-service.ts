/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Transfer } from "@/types/types"
import { transferService, cashAccountService } from "@/lib/mock-service"

export const addTransfer = async (transferData: Omit<Transfer, "id" | "createdAt" | "updatedAt">) => {
  try {
    // Buscar contas de origem e destino
    const originAccount = await cashAccountService.getById(transferData.originAccountId)
    const destinationAccount = await cashAccountService.getById(transferData.destinationAccountId)

    if (!originAccount || !destinationAccount) {
      throw new Error("Uma ou ambas as contas não existem")
    }

    // Converter valores para números
    const transferValue = Number.parseFloat(transferData.value.replace(/[^\d,.-]/g, "").replace(",", "."))
    const originValue = Number.parseFloat(originAccount.value.replace(/[^\d,.-]/g, "").replace(",", "."))
    const destinationValue = Number.parseFloat(destinationAccount.value.replace(/[^\d,.-]/g, "").replace(",", "."))

    // Verificar se a conta de origem tem saldo suficiente
    if (originValue < transferValue) {
      throw new Error("Saldo insuficiente na conta de origem")
    }

    // Calcular novos saldos
    const newOriginValue = originValue - transferValue
    const newDestinationValue = destinationValue + transferValue

    // Atualizar saldos
    await cashAccountService.update(transferData.originAccountId, {
      value: `R$ ${newOriginValue.toFixed(2).replace(".", ",")}`,
    })

    await cashAccountService.update(transferData.destinationAccountId, {
      value: `R$ ${newDestinationValue.toFixed(2).replace(".", ",")}`,
    })

    // Adicionar registro de transferência
    const id = await transferService.add(transferData)

    return { id, ...transferData }
  } catch (error) {
    console.error("Erro ao adicionar transferência:", error)
    throw error
  }
}

export const getAllTransfers = async (businessUnitId: string) => {
  try {
    const transfers = await transferService.getByField("businessUnitId", businessUnitId)
    return transfers.sort((a, b) => b.date.getTime() - a.date.getTime())
  } catch (error) {
    console.error("Erro ao obter transferências:", error)
    throw error
  }
}

export const getTransferById = async (id: string) => {
  try {
    return await transferService.getById(id)
  } catch (error) {
    console.error(`Erro ao obter transferência com ID ${id}:`, error)
    throw error
  }
}

export const updateTransfer = async (id: string, transferData: Partial<Transfer>) => {
  try {
    // Não permitimos alterar os valores de uma transferência já realizada
    const { originAccountId, destinationAccountId, value, ...updateData } = transferData

    await transferService.update(id, updateData)

    return { id, ...updateData }
  } catch (error) {
    console.error(`Erro ao atualizar transferência com ID ${id}:`, error)
    throw error
  }
}

export const deleteTransfer = async (id: string) => {
  try {
    // Buscar a transferência para reverter os valores
    const transfer = await getTransferById(id)

    if (!transfer) {
      throw new Error("Transferência não encontrada")
    }

    // Buscar contas de origem e destino
    const originAccount = await cashAccountService.getById(transfer.originAccountId)
    const destinationAccount = await cashAccountService.getById(transfer.destinationAccountId)

    if (!originAccount || !destinationAccount) {
      throw new Error("Uma ou ambas as contas não existem mais")
    }

    // Converter valores para números
    const transferValue = Number.parseFloat(transfer.value.replace(/[^\d,.-]/g, "").replace(",", "."))
    const originValue = Number.parseFloat(originAccount.value.replace(/[^\d,.-]/g, "").replace(",", "."))
    const destinationValue = Number.parseFloat(destinationAccount.value.replace(/[^\d,.-]/g, "").replace(",", "."))

    // Verificar se a conta de destino tem saldo suficiente para reverter
    if (destinationValue < transferValue) {
      throw new Error("Saldo insuficiente na conta de destino para reverter a transferência")
    }

    // Calcular novos saldos (revertendo a transferência)
    const newOriginValue = originValue + transferValue
    const newDestinationValue = destinationValue - transferValue

    // Atualizar saldos
    await cashAccountService.update(transfer.originAccountId, {
      value: `R$ ${newOriginValue.toFixed(2).replace(".", ",")}`,
    })

    await cashAccountService.update(transfer.destinationAccountId, {
      value: `R$ ${newDestinationValue.toFixed(2).replace(".", ",")}`,
    })

    // Excluir o registro de transferência
    await transferService.delete(id)

    return true
  } catch (error) {
    console.error(`Erro ao excluir transferência com ID ${id}:`, error)
    throw error
  }
}

export const searchTransfers = async (businessUnitId: string, searchTerm: string) => {
  try {
    const transfers = await getAllTransfers(businessUnitId)

    const lowerSearchTerm = searchTerm.toLowerCase()

    return transfers.filter(
      (transfer) =>
        transfer.code?.toLowerCase().includes(lowerSearchTerm) ||
        transfer.description?.toLowerCase().includes(lowerSearchTerm) ||
        transfer.value?.toLowerCase().includes(lowerSearchTerm),
    )
  } catch (error) {
    console.error("Erro ao pesquisar transferências:", error)
    throw error
  }
}
