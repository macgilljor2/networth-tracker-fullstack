'use client'

import React, { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { cn } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface BalanceHistoryPoint {
  date: string
  balance: number
}

export interface LineChartProps {
  data?: BalanceHistoryPoint[] | ChartData<'line'>
  title?: string
  height?: number
  loading?: boolean
  showTooltip?: boolean
  className?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 300,
  loading = false,
  showTooltip = true,
  className,
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // Check if data is BalanceHistoryPoint[] or ChartData
  const isBalanceHistoryArray = Array.isArray(data) && data.length > 0 && 'date' in data[0]

  const chartData = isBalanceHistoryArray
    ? {
        labels: data.map((point) => new Date((point as BalanceHistoryPoint).date).toLocaleDateString()),
        datasets: [
          {
            label: 'Balance',
            data: data.map((point) => (point as BalanceHistoryPoint).balance),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : (data as ChartData<'line'>) || { labels: [], datasets: [] }

  const options: React.ComponentProps<typeof Line>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable initial animation
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: 'rgba(250, 248, 245, 0.95)',
        titleColor: '#3d3428',
        bodyColor: '#3d3428',
        borderColor: 'rgba(90, 143, 90, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
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
            const value = context.parsed.y
            if (value == null) return 'Balance: —'
            return `${context.dataset.label}: £${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(109, 92, 74, 0.08)',
        },
        ticks: {
          color: '#6d5c4a',
          font: {
            family: "'Quicksand', sans-serif",
            size: 11,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(109, 92, 74, 0.08)',
        },
        ticks: {
          color: '#6d5c4a',
          font: {
            family: "'Quicksand', sans-serif",
            size: 11,
          },
          callback: (value) => {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string)
            if (numValue === 0) return '£0'
            return `£${(numValue / 1000).toFixed(0)}k`
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Check if data is empty
  const hasData = Array.isArray(data)
    ? data.length > 0
    : (data && (data.datasets?.length || 0) > 0)

  if (!hasData) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500', className)} style={{ height }}>
        <p>No data available</p>
      </div>
    )
  }

  return (
    <div className={cn(className)} style={{ height }}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="w-full h-full" style={{ height: height - (title ? 40 : 0) }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  )
}
