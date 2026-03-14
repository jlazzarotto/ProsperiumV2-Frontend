/* eslint-disable @typescript-eslint/no-explicit-any */
// Função para calcular valores do DRE, adaptada da lógica original
export function calculateDreValues(dreData: any) {
  const result = {
    data: { ...dreData },
    groupTotals: {} as Record<string, Record<string, number>>,
    periods: {} as Record<string, boolean>,
  }

  // Extract all periods (months)
  const periods = new Set<string>()
  Object.values(dreData).forEach((group: any) => {
    if (group && typeof group === "object") {
      if (group.multi === "1") {
        Object.entries(group).forEach(([key, value]: [string, any]) => {
          if (typeof value === "object" && value !== null && key !== "multi" && key !== "title_group") {
            Object.keys(value).forEach((period) => {
              if (period.match(/^\d{6}$/)) {
                periods.add(period)
              }
            })
          }
        })
      } else {
        Object.keys(group).forEach((key) => {
          if (key.match(/^\d{6}$/)) {
            periods.add(key)
          }
        })
      }
    }
  })

  const periodsList = Array.from(periods).sort()
  periodsList.forEach((period) => {
    result.periods[period] = true
  })

  // Calculate group totals for multi groups
  Object.entries(dreData).forEach(([groupId, group]: [string, any]) => {
    if (group && typeof group === "object" && group.multi === "1") {
      result.groupTotals[groupId] = {}

      periodsList.forEach((period) => {
        let total = 0

        Object.entries(group).forEach(([key, value]: [string, any]) => {
          if (typeof value === "object" && value !== null && key !== "multi" && key !== "title_group") {
            if (value[period] !== null && value[period] !== undefined) {
              total += Number.parseFloat(value[period] || 0)
            }
          }
        })

        result.groupTotals[groupId][period] = total
      })
    }
  })

  // Calculate formula-based values - adaptado da função setDRESingleRowValue do código original
  const calculateFormula = (formula: string, period: string) => {
    if (!formula) return null

    const parts = formula.split(";")
    let operation = ""
    let value = 0
    let isFirst = true
    const parcels: Record<string, string[]> = {}

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]

      if (part.startsWith("(") && part.endsWith(")")) {
        operation = part.substring(1, part.length - 1)
      } else {
        if (!parcels[operation]) {
          parcels[operation] = []
        }
        parcels[operation].push(part)
      }
    }

    Object.entries(parcels).forEach(([op, fields]) => {
      fields.forEach((field) => {
        let fieldValue = 0

        if (dreData[field]) {
          if (dreData[field].multi === "1") {
            fieldValue = result.groupTotals[field][period] || 0
          } else if (dreData[field].formula) {
            fieldValue = calculateFormula(dreData[field].formula, period) || 0
          } else {
            fieldValue = Number.parseFloat(dreData[field][period] || 0)
          }

          if (isFirst) {
            value = fieldValue
            isFirst = false
          } else {
            if (op === "soma") {
              value += fieldValue
            } else if (op === "subtracao") {
              value -= fieldValue
            } else if (op === "multiplicacao") {
              value *= fieldValue
            } else if (op === "divisao" && fieldValue !== 0) {
              value /= fieldValue
            }
          }
        }
      })
    })

    return value
  }

  Object.entries(dreData).forEach(([groupId, group]: [string, any]) => {
    if (group && typeof group === "object" && group.formula) {
      periodsList.forEach((period) => {
        const calculatedValue = calculateFormula(group.formula, period)
        result.data[groupId][period] = calculatedValue
      })
    }
  })

  return result
}

