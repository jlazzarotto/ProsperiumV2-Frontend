// /* eslint-disable @typescript-eslint/no-explicit-any */

// "use client"

// import { useEffect, useRef } from "react"
// import { Chart, registerables, type ChartType } from "chart.js"

// Chart.register(...registerables)

// interface FinancialHealthGaugeProps {
//   value: number
// }

// export function FinancialHealthGauge({ value }: FinancialHealthGaugeProps) {
//   const chartRef = useRef<HTMLCanvasElement>(null)
//   const chartInstance = useRef<Chart | null>(null)

//   useEffect(() => {
//     if (!chartRef.current) return

//     // Destruir gráfico anterior se existir
//     if (chartInstance.current) {
//       chartInstance.current.destroy()
//     }

//     // Criar novo gráfico
//     const ctx = chartRef.current.getContext("2d")
//     if (ctx) {
//       // Determinar cor com base no valor
//       let color = "rgba(239, 68, 68, 1)" // Vermelho para valores baixos

//       if (value >= 70) {
//         color = "rgba(16, 185, 129, 1)" // Verde para valores altos
//       } else if (value >= 40) {
//         color = "rgba(245, 158, 11, 1)" // Amarelo para valores médios
//       }

//       // Calcular o restante para completar o círculo
//       const remainder = 100 - value

//       chartInstance.current = new Chart(ctx, {
//         type: "doughnut" as ChartType,
//         data: {
//           datasets: [
//             {
//               data: [value, remainder],
//               backgroundColor: [color, "rgba(203, 213, 225, 0.3)"],
//               borderWidth: 0,
//               circumference: 180,
//               rotation: 270,
//             },
//           ],
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           cutout: "75%",
//           plugins: {
//             legend: {
//               display: false,
//             },
//             tooltip: {
//               enabled: false,
//             },
//           },
//           layout: {
//             padding: 20,
//           },
//         },
//       })

//       // Adicionar texto no centro
//       if (chartInstance.current) {
//         const originalDraw = chartInstance.current.draw
//         chartInstance.current.draw = function () {
//           originalDraw.apply(this, arguments as any)

//           if (ctx) {
//             const width = this.width
//             const height = this.height

//             ctx.restore()
//             ctx.font = "bold 24px sans-serif"
//             ctx.textBaseline = "middle"
//             ctx.textAlign = "center"

//             let statusText = "Crítico"
//             if (value >= 70) {
//               statusText = "Excelente"
//               ctx.fillStyle = "rgba(16, 185, 129, 1)"
//             } else if (value >= 40) {
//               statusText = "Atenção"
//               ctx.fillStyle = "rgba(245, 158, 11, 1)"
//             } else {
//               ctx.fillStyle = "rgba(239, 68, 68, 1)"
//             }

//             ctx.fillText(`${Math.round(value)}%`, width / 2, height / 2 - 10)

//             ctx.font = "14px sans-serif"
//             ctx.fillText(statusText, width / 2, height / 2 + 20)

//             ctx.save()
//           }
//         }
//       }
//     }

//     return () => {
//       if (chartInstance.current) {
//         chartInstance.current.destroy()
//       }
//     }
//   }, [value])

//   return <canvas ref={chartRef} />
// }

