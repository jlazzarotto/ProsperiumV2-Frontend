import { httpClient } from "@/lib/http-client";

export interface Tipo8BusinessUnit {
  id: number;
  id_pessoa: number;
  apelido: string;
  abreviatura: string;
}

export interface Cliente {
  id: number;
  id_pessoa: number;
  name: string;
  nome: string;
  id_tipo_cadastro: number;
  // Optional fields from full person data
  email?: string;
  cpf_cnpj?: string;
  tipo_pessoa?: string;
  telefone?: string;
  celular?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ClienteUnidade {
  id: number;
  id_pessoa: number;
  name: string;
  nome: string;
  id_tipo_cadastro: number;
}

// Buscar todas as unidades de negócio tipo 8
export const getTipo8BusinessUnits = async (): Promise<Tipo8BusinessUnit[]> => {
  try {
    const response = await httpClient.get('test/business-units');
    console.log('🏢 Unidades tipo 8 recebidas:', response);
    return Array.isArray(response) ? response : ((response as any)?.data || []);
  } catch (error) {
    console.error('Erro ao buscar unidades tipo 8:', error);
    throw error;
  }
};

// Buscar clientes vinculados a uma unidade de negócio específica
export const getClientesVinculadosUnidade = async (unidadeId: string): Promise<Cliente[]> => {
  try {
    const response = await httpClient.get(`test/business-units/${unidadeId}/clientes`);
    console.log('👥 Clientes vinculados recebidos:', response);
    return Array.isArray(response) ? response : ((response as any)?.data || []);
  } catch (error) {
    console.error('Erro ao buscar clientes vinculados:', error);
    throw error;
  }
};

// Buscar todos os clientes (pessoas não tipo 8) - DEPRECATED
export const getAllClientes = async (): Promise<Cliente[]> => {
  try {
    const response = await httpClient.get('pessoas/clientes');
    console.log('👥 Clientes recebidos:', response);
    return Array.isArray(response) ? response : ((response as any)?.data || []);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};

// Buscar clientes vinculados a uma unidade específica
export const getClientesPorUnidade = async (unidadeId: number): Promise<ClienteUnidade[]> => {
  try {
    const response = await httpClient.get(`pessoas/unidades-tipo-8/${unidadeId}/clientes`);
    console.log(`👥 Clientes da unidade ${unidadeId}:`, response);
    return Array.isArray(response) ? response : ((response as any)?.data || []);
  } catch (error) {
    console.error(`Erro ao buscar clientes da unidade ${unidadeId}:`, error);
    throw error;
  }
};

// Buscar todas as pessoas para carregamento reverso
export const getAllPessoas = async (): Promise<Cliente[]> => {
  try {
    const response = await httpClient.get('pessoas');
    console.log('👥 Todas as pessoas recebidas:', response);
    return Array.isArray(response) ? response : ((response as any)?.data || []);
  } catch (error) {
    console.error('Erro ao buscar todas as pessoas:', error);
    throw error;
  }
};

