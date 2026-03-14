/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DreData {
  id: string
  name: string
  company: string
  cnpj: string
  period: string
  createdAt: string
  updatedAt: string
  data: any
}

interface DreStore {
  dres: DreData[]
  addDre: (dre: DreData) => void
  updateDre: (id: string, data: Partial<DreData>) => void
  deleteDre: (id: string) => void
  getDreById: (id: string) => DreData | undefined
  dreData: any; // Add the 'dreData' property with the appropriate type
  setDreData: (data: any) => void; 
}

const initialDres: DreData[] = [
  {
    id: "dre-1",
    name: "DRE Trimestral 2024",
    company: "Empresa Demonstração Ltda",
    cnpj: "12.345.678/0001-90",
    period: "Janeiro a Março de 2024",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      rec_oper: {
        multi: "1",
        title_group: "(+) RECEITA OPERACIONAL BRUTA",
        "Vendas de Mercadorias": {
          "202401": "125000.00",
          "202402": "132500.00",
          "202403": "140000.00",
        },
        "Prestação de Serviços": {
          "202401": "75000.00",
          "202402": "78000.00",
          "202403": "82000.00",
        },
        "Outras Receitas Operacionais": {
          "202401": "12000.00",
          "202402": "13500.00",
          "202403": "15000.00",
        },
      },
      deducoes: {
        multi: "1",
        title_group: "(-) DEDUÇÕES DA RECEITA BRUTA",
        "Impostos sobre Vendas": {
          "202401": "38250.00",
          "202402": "40425.00",
          "202403": "42750.00",
        },
        "Devoluções e Abatimentos": {
          "202401": "5300.00",
          "202402": "4800.00",
          "202403": "5100.00",
        },
      },
      rec_liq: {
        multi: "0",
        title_group: "(=) RECEITA OPERACIONAL LÍQUIDA",
        formula: "(subtracao);rec_oper;deducoes",
      },
      cpr: {
        multi: "1",
        title_group: "(-) CUSTO DOS PRODUTOS/SERVIÇOS",
        "Custo das Mercadorias Vendidas": {
          "202401": "62500.00",
          "202402": "66250.00",
          "202403": "70000.00",
        },
        "Custo dos Serviços Prestados": {
          "202401": "30000.00",
          "202402": "31200.00",
          "202403": "32800.00",
        },
      },
      lucro_bruto: {
        multi: "0",
        title_group: "(=) LUCRO BRUTO",
        formula: "(subtracao);rec_liq;cpr",
      },
      desp_oper: {
        multi: "1",
        title_group: "(-) DESPESAS OPERACIONAIS",
        "Despesas Administrativas": {
          "202401": "18000.00",
          "202402": "18500.00",
          "202403": "19000.00",
        },
        "Despesas com Vendas": {
          "202401": "12500.00",
          "202402": "13250.00",
          "202403": "14000.00",
        },
        "Despesas Financeiras": {
          "202401": "5000.00",
          "202402": "5200.00",
          "202403": "5400.00",
        },
        "Despesas Gerais": {
          "202401": "8500.00",
          "202402": "8800.00",
          "202403": "9100.00",
        },
      },
      rec_fin: {
        multi: "1",
        title_group: "(+) RECEITAS FINANCEIRAS",
        "Juros Recebidos": {
          "202401": "2500.00",
          "202402": "2700.00",
          "202403": "2900.00",
        },
        "Descontos Obtidos": {
          "202401": "1200.00",
          "202402": "1350.00",
          "202403": "1500.00",
        },
      },
      res_oper: {
        multi: "0",
        title_group: "(=) RESULTADO OPERACIONAL",
        formula: "(soma);lucro_bruto;rec_fin;(subtracao);desp_oper",
      },
      res_nao_oper: {
        multi: "1",
        title_group: "(+/-) RESULTADOS NÃO OPERACIONAIS",
        "Venda de Ativos": {
          "202401": "0.00",
          "202402": "15000.00",
          "202403": "0.00",
        },
        "Outras Receitas/Despesas": {
          "202401": "-1200.00",
          "202402": "-1500.00",
          "202403": "-1800.00",
        },
      },
      res_antes_ir: {
        multi: "0",
        title_group: "(=) RESULTADO ANTES DO IR/CS",
        formula: "(soma);res_oper;res_nao_oper",
      },
      ir_cs: {
        multi: "1",
        title_group: "(-) PROVISÃO PARA IR E CS",
        "Imposto de Renda": {
          "202401": "9500.00",
          "202402": "12800.00",
          "202403": "10200.00",
        },
        "Contribuição Social": {
          "202401": "5700.00",
          "202402": "7680.00",
          "202403": "6120.00",
        },
      },
      lucro_liq: {
        multi: "0",
        title_group: "(=) LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO",
        formula: "(subtracao);res_antes_ir;ir_cs",
      },
    },
  },
  {
    id: "dre-2",
    name: "DRE Anual 2023",
    company: "Empresa Demonstração Ltda",
    cnpj: "12.345.678/0001-90",
    period: "Janeiro a Dezembro de 2023",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    data: {
      rec_oper: {
        multi: "1",
        title_group: "(+) RECEITA OPERACIONAL BRUTA",
        "Vendas de Mercadorias": {
          "202301": "110000.00",
          "202302": "115000.00",
          "202303": "120000.00",
        },
        "Prestação de Serviços": {
          "202301": "65000.00",
          "202302": "68000.00",
          "202303": "72000.00",
        },
      },
      deducoes: {
        multi: "1",
        title_group: "(-) DEDUÇÕES DA RECEITA BRUTA",
        "Impostos sobre Vendas": {
          "202301": "35000.00",
          "202302": "36500.00",
          "202303": "38400.00",
        },
      },
      rec_liq: {
        multi: "0",
        title_group: "(=) RECEITA OPERACIONAL LÍQUIDA",
        formula: "(subtracao);rec_oper;deducoes",
      },
      cpr: {
        multi: "1",
        title_group: "(-) CUSTO DOS PRODUTOS/SERVIÇOS",
        "Custo das Mercadorias Vendidas": {
          "202301": "55000.00",
          "202302": "57500.00",
          "202303": "60000.00",
        },
        "Custo dos Serviços Prestados": {
          "202301": "26000.00",
          "202302": "27200.00",
          "202303": "28800.00",
        },
      },
      lucro_bruto: {
        multi: "0",
        title_group: "(=) LUCRO BRUTO",
        formula: "(subtracao);rec_liq;cpr",
      },
      desp_oper: {
        multi: "1",
        title_group: "(-) DESPESAS OPERACIONAIS",
        "Despesas Administrativas": {
          "202301": "16000.00",
          "202302": "16500.00",
          "202303": "17000.00",
        },
        "Despesas com Vendas": {
          "202301": "11000.00",
          "202302": "11500.00",
          "202303": "12000.00",
        },
      },
      lucro_liq: {
        multi: "0",
        title_group: "(=) LUCRO/PREJUÍZO LÍQUIDO DO EXERCÍCIO",
        formula: "(subtracao);lucro_bruto;desp_oper",
      },
    },
  },
]

export const useDreStore = create<DreStore>()(
  persist(
    (set, get) => ({
      dres: initialDres,
      addDre: (dre) => set((state) => ({ dres: [...state.dres, dre] })),
      updateDre: (id, data) =>
        set((state) => ({
          dres: state.dres.map((dre) =>
            dre.id === id ? { ...dre, ...data, updatedAt: new Date().toISOString() } : dre,
          ),
        })),
      deleteDre: (id) =>
        set((state) => ({
          dres: state.dres.filter((dre) => dre.id !== id),
        })),
      getDreById: (id) => {
        return get().dres.find((dre) => dre.id === id)
      },
      dreData: null,
      setDreData: (data) => set(() => ({ dreData: data })),
    }),
    {
      name: "dre-storage",
    },
  ),
)

