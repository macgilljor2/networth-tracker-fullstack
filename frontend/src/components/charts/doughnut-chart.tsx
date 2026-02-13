'use client'

import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { cn } from '@/lib/utils'

ChartJS.register(ArcElement, Tooltip, Legend)

export interface DoughnutChartProps {
  data: {
    labels: string[]
    values: number[]
    colors?: string[]
  }
  title?: string
  size?: number
  loading?: boolean
  showLegend?: boolean
  className?: string
}

const COLORS = [
  '#22c55e', // green
  '#7a9a6a', // sage
  '#c49464', // terracotta
  '#a6926a', // beige-600
  '#16a34a', // green-600
  '#5c7a4d', // sage-dark
]

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  data,
  title,
  size = 300,
  loading = false,
  showLegend = true,
  className,
}) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors || COLORS.slice(0, data.values.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const options: React.ComponentProps<typeof Doughnut>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: "'Quicksand', sans-serif",
          },
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] as number
                const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                const color = (data.datasets[0].backgroundColor as string[])[i]
                return {
                  text: `${label}: £${value.toLocaleString()} (${percentage}%)`,
                  fillStyle: color || COLORS[i],
                  index: i,
                } as any
              })
            }
            return []
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: "'Quicksand', sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "'Quicksand', sans-serif",
        },
        callbacks: {
          label: (context) => {
            const value = context.parsed as number
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `£${value.toLocaleString()} (${percentage}%)`
          },
        },
      },
    },
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (data.values.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500', className)} style={{ width: size, height: size }}>
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div style={{ width: size, height: size }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}
